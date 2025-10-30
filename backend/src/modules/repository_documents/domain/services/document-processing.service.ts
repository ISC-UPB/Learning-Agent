import { Logger } from '@nestjs/common';
import { ProcessingJob, ProcessingType, ProcessingStatus } from '../entities/processing-job.entity';
import { Document, DocumentStatus } from '../entities/document.entity';
import { ProcessingJobRepositoryPort } from '../ports/processing-job-repository.port';
import { DocumentRepositoryPort } from '../ports/document-repository.port';
import { TextExtractionPort } from '../ports/text-extraction.port';
import { DocumentChunkingService } from './document-chunking.service';
import { DocumentEmbeddingService } from './document-embedding.service';
import { DocumentStoragePort } from '../ports/document-storage.port';

/**
 * Opciones para el procesamiento de documentos
 */
export interface DocumentProcessingOptions {
  /** Reintentar jobs fallidos */
  retryFailed?: boolean;
  /** Reemplazar jobs existentes */
  replaceExisting?: boolean;
  /** Reemplazar resultados existentes (chunks, embeddings) */
  replaceResults?: boolean;
  /** Configuración específica para chunking */
  chunkingConfig?: {
    maxChunkSize?: number;
    overlap?: number;
    respectParagraphs?: boolean;
    respectSentences?: boolean;
  };
}

/**
 * Resultado del procesamiento de documentos
 */
export interface DocumentProcessingResult {
  /** ID del job */
  jobId: string;
  /** Tipo de procesamiento */
  type: ProcessingType;
  /** Estado final */
  status: ProcessingStatus;
  /** Mensaje de error si lo hay */
  error?: string;
  /** Tiempo de procesamiento en ms */
  processingTimeMs: number;
  /** Detalles del resultado */
  result?: Record<string, any>;
}

/**
 * Servicio de dominio para el procesamiento de documentos
 */
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);

  constructor(
    private readonly jobRepository: ProcessingJobRepositoryPort,
    private readonly documentRepository: DocumentRepositoryPort,
    private readonly textExtraction: TextExtractionPort,
    private readonly documentStorage: DocumentStoragePort,
    private readonly chunkingService: DocumentChunkingService,
    private readonly embeddingService: DocumentEmbeddingService,
  ) {}

  /**
   * Inicia el procesamiento completo de un documento
   */
  async processDocument(
    documentId: string,
    options: DocumentProcessingOptions = {},
  ): Promise<DocumentProcessingResult> {
    try {
      // 1. Verificar documento
      const document = await this.documentRepository.findById(documentId);
      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      // 2. Verificar jobs activos
      const activeJobs = await this.jobRepository.findActiveByDocument(documentId);
      if (activeJobs.length > 0 && !options.replaceExisting) {
        throw new Error(
          `Document ${documentId} has active processing jobs. Use replaceExisting to override.`,
        );
      }

      // 3. Crear nuevo job
      const job = ProcessingJob.create(
        `job-${Date.now()}`,
        documentId,
        ProcessingType.FULL_PROCESSING,
        {
          options,
          steps: ['text-extraction', 'chunking', 'embeddings'],
          startedAt: new Date(),
        },
      );

      const savedJob = await this.jobRepository.save(job);

      // 4. Iniciar procesamiento
      const startTime = Date.now();
      const result = await this.executeProcessing(savedJob, document, options);

      return {
        jobId: job.id,
        type: job.jobType,
        status: result.status,
        error: result.errorMessage,
        processingTimeMs: Date.now() - startTime,
        result: result.result,
      };
    } catch (error) {
      this.logger.error(
        `Error processing document ${documentId}:`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  /**
   * Ejecuta el procesamiento de un job
   */
  private async executeProcessing(
    job: ProcessingJob,
    document: Document,
    options: DocumentProcessingOptions,
  ): Promise<ProcessingJob> {
    try {
      // 1. Marcar como iniciado
      let currentJob = await this.jobRepository.save(job);

      // 2. Procesar texto si es necesario
      if (!document.extractedText || !document.textHash || options.replaceResults) {
        currentJob = await this.extractText(currentJob, document);
        if (currentJob.status === ProcessingStatus.FAILED) {
          return currentJob;
        }
      }

      // 3. Procesar chunks
      currentJob = await this.processChunks(currentJob, document, options);
      if (currentJob.status === ProcessingStatus.FAILED) {
        return currentJob;
      }

      // 4. Generar embeddings
      currentJob = await this.generateEmbeddings(currentJob, document, options);
      if (currentJob.status === ProcessingStatus.FAILED) {
        return currentJob;
      }

      // 5. Actualizar estado del documento
      await this.documentRepository.save(
        document.withStatus(DocumentStatus.PROCESSED)
      );

      // 6. Marcar job como completado
      return await this.jobRepository.save(
        currentJob.complete({
          completedAt: new Date(),
          processingTimeMs: Date.now() - currentJob.startedAt!.getTime(),
        }),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during processing';
      return await this.jobRepository.save(job.fail(errorMessage));
    }
  }

  /**
   * Extrae el texto del documento
   */
  private async extractText(
    job: ProcessingJob,
    document: Document,
  ): Promise<ProcessingJob> {
    try {
      // 1. Actualizar progreso
      let currentJob = new ProcessingJob(
        job.id,
        job.documentId,
        job.jobType,
        ProcessingStatus.RUNNING,
        10,
        undefined,
        {
          ...job.jobDetails,
          progressMessage: 'Extracting text...',
        },
        job.result,
        job.startedAt,
        undefined,
        job.createdAt,
      );
      currentJob = await this.jobRepository.save(currentJob);

      // 2. Obtener contenido del documento
      const content = await this.documentStorage.getFileContent(document.s3Key);

      // 3. Extraer texto
      const { text, metadata } = await this.textExtraction.extract(
        content,
        document.mimeType,
      );

      // 4. Actualizar documento con el texto extraído y metadatos
      await this.documentRepository.save(
        document.withExtractedText(
          text,
          metadata.textHash,
          metadata.pageCount,
          metadata.title,
          metadata.author,
          metadata.language
        )
      );

      // 5. Actualizar progreso
      return await this.jobRepository.save(
        new ProcessingJob(
          currentJob.id,
          currentJob.documentId,
          currentJob.jobType,
          ProcessingStatus.RUNNING,
          30,
          undefined,
          {
            ...currentJob.jobDetails,
            progressMessage: 'Text extraction completed',
          },
          currentJob.result,
          currentJob.startedAt,
          undefined,
          currentJob.createdAt,
        ),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error during text extraction';
      return await this.jobRepository.save(job.fail(errorMessage));
    }
  }

  /**
   * Procesa los chunks del documento
   */
  private async processChunks(
    job: ProcessingJob,
    document: Document,
    options: DocumentProcessingOptions,
  ): Promise<ProcessingJob> {
    try {
      // 1. Actualizar progreso
      let currentJob = job.updateProgress(40).withProgressMessage('Processing chunks...');
      currentJob = await this.jobRepository.save(currentJob);

      // 2. Procesar chunks
      if (!document.extractedText) {
        return await this.jobRepository.save(
          currentJob.fail('Document has no extracted text to process'),
        );
      }

      const result = await this.chunkingService.processDocumentChunks(
        document.id,
        document.extractedText,
        {
          chunkingConfig: options.chunkingConfig,
          replaceExisting: options.replaceResults
        }
      );

      if (result.status === 'error') {
        return await this.jobRepository.save(
          currentJob.fail(`Error processing chunks: ${result.errors?.join(', ')}`),
        );
      }

      // 3. Actualizar progreso
      return await this.jobRepository.save(
        currentJob.updateProgress(60).withProgressMessage('Chunk processing completed'),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during chunking';
      return await this.jobRepository.save(job.fail(errorMessage));
    }
  }

  /**
   * Genera embeddings para los chunks del documento
   */
  private async generateEmbeddings(
    job: ProcessingJob,
    document: Document,
    options: DocumentProcessingOptions = {},
  ): Promise<ProcessingJob> {
    try {
      // 1. Actualizar progreso
      let currentJob = job.updateProgress(70).withProgressMessage('Generating embeddings...');
      currentJob = await this.jobRepository.save(currentJob);

      // 2. Generar embeddings
      const result = await this.embeddingService.generateDocumentEmbeddings(
        document.id,
        {
          replaceExisting: options.replaceResults
        }
      );

      if (result.chunksWithErrors > 0) {
        return await this.jobRepository.save(
          currentJob.fail(`Error generating embeddings: ${result.errors?.join(', ')}`)
        );
      }

      // 3. Actualizar progreso
      return await this.jobRepository.save(
        currentJob.updateProgress(90).withProgressMessage('Embedding generation completed')
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error during embedding generation';
      return await this.jobRepository.save(job.fail(errorMessage));
    }
  }

  /**
   * Reintenta un job fallido
   */
  async retryJob(jobId: string): Promise<DocumentProcessingResult> {
    // 1. Buscar job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // 2. Verificar que puede ser reintentado
    if (job.status !== ProcessingStatus.FAILED || (job.jobDetails?.retryCount || 0) >= 3) {
      throw new Error(`Job ${jobId} cannot be retried`);
    }

    // 3. Buscar documento
    const document = await this.documentRepository.findById(job.documentId);
    if (!document) {
      throw new Error(`Document ${job.documentId} not found`);
    }

    // 4. Crear nuevo job de reintento
    const retryJob = new ProcessingJob(
      `retry-${job.id}-${Date.now()}`,
      job.documentId,
      job.jobType,
      ProcessingStatus.PENDING,
      0,
      undefined,
      {
        ...job.jobDetails,
        originalJobId: job.id,
        retryCount: (job.jobDetails?.retryCount || 0) + 1,
      },
      undefined,
      undefined,
      undefined,
      new Date(),
    );
    const savedJob = await this.jobRepository.save(retryJob);

    // 5. Ejecutar procesamiento
    const startTime = Date.now();
    const result = await this.executeProcessing(savedJob, document, {});

    return {
      jobId: result.id,
      type: result.jobType,
      status: result.status,
      error: result.errorMessage,
      processingTimeMs: Date.now() - startTime,
      result: result.result,
    };
  }

  /**
   * Cancela un job activo
   */
  async cancelJob(jobId: string, reason?: string): Promise<void> {
    // 1. Buscar job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // 2. Verificar que puede ser cancelado
    const isTerminal = [
      ProcessingStatus.COMPLETED,
      ProcessingStatus.FAILED,
      ProcessingStatus.CANCELLED,
    ].includes(job.status);
    
    if (isTerminal) {
      throw new Error(`Job ${jobId} is already in terminal state`);
    }

    // 3. Cancelar job
    await this.jobRepository.save(
      new ProcessingJob(
        job.id,
        job.documentId,
        job.jobType,
        ProcessingStatus.CANCELLED,
        job.progress,
        reason,
        job.jobDetails,
        job.result,
        job.startedAt,
        new Date(),
        job.createdAt,
      ),
    );
  }

  /**
   * Marca jobs antiguos como fallidos
   */
  async cleanupStaleJobs(maxAgeHours: number = 24): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);

    return await this.jobRepository.markStaleJobsAsFailed(cutoffDate);
  }
}