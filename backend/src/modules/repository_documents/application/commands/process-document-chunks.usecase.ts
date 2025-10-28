import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';
import type {
  DocumentChunkingService,
  ProcessChunksResult,
} from '../../domain/services/document-chunking.service';
import { DocumentStatus } from '../../domain/entities/document.entity';

/**
 * Command to process document chunks
 */
export interface ProcessDocumentChunksCommand {
  /** ID of document to process */
  documentId: string;

  /** Custom chunking configuration (optional) */
  chunkingConfig?: {
    maxChunkSize?: number;
    overlap?: number;
    respectParagraphs?: boolean;
    respectSentences?: boolean;
    minChunkSize?: number;
  };

  /** Whether to replace existing chunks */
  replaceExisting?: boolean;

  /** Custom chunk type */
  chunkType?: string;
}

/**
 * Use case to process document chunks
 *
 * Orchestrates the complete chunking process:
 * 1. Validate that document exists and has extracted text
 * 2. Process chunks using domain service
 * 3. Update document status
 */
@Injectable()
export class ProcessDocumentChunksUseCase {
  private readonly logger = new Logger(ProcessDocumentChunksUseCase.name);

  constructor(
    private readonly documentRepository: DocumentRepositoryPort,
    private readonly chunkingService: DocumentChunkingService,
  ) {}

  /**
   * Execute chunk processing for a document
   */
  async execute(
    command: ProcessDocumentChunksCommand,
  ): Promise<ProcessChunksResult> {
    const { documentId, chunkingConfig, replaceExisting, chunkType } = command;

    try {
      this.logger.log(`Starting chunk processing for document: ${documentId}`);

      // 1. Verify that document exists
      const document = await this.documentRepository.findById(documentId);
      if (!document) {
        throw new NotFoundException(`Document not found: ${documentId}`);
      }

      // 2. Verify that document has extracted text
      if (
        !document.extractedText ||
        document.extractedText.trim().length === 0
      ) {
        throw new Error(`Document ${documentId} has no extracted text`);
      }

      // 3. Verify document status
      if (document.status !== DocumentStatus.PROCESSED) {
        this.logger.warn(
          `Document ${documentId} has status ${document.status}, but continuing with chunking`,
        );
      }

      // 4. Check if chunks already exist (if not replacing)
      if (!replaceExisting) {
        const canCheckExisting =
          typeof (this.chunkingService as any).getDocumentChunks === 'function';
        if (canCheckExisting) {
          const existingChunks = await (
            this.chunkingService as any
          ).getDocumentChunks(documentId);
          if (existingChunks.total > 0) {
            this.logger.log(
              `Document ${documentId} already has ${existingChunks.total} existing chunks. Skipping processing.`,
            );
            return {
              status: 'success',
              savedChunks: existingChunks.chunks,
              chunkingResult: {
                chunks: existingChunks.chunks,
                totalChunks: existingChunks.total,
                statistics: {
                  ...existingChunks.statistics,
                  actualOverlapPercentage: 0,
                },
              },
              processingTimeMs: 0,
            };
          }
        }
      }

      // 5. Process chunks using domain service
      const result = await this.chunkingService.processDocumentChunks(
        documentId,
        document.extractedText,
        {
          chunkingConfig,
          replaceExisting,
          chunkType,
        },
      );

      // 6. Log result
      if (result.status === 'success') {
        this.logger.log(
          `Chunks processed successfully for document ${documentId}: ` +
            `${result.savedChunks.length} chunks created in ${result.processingTimeMs}ms`,
        );

        this.logger.log(
          `Chunking statistics: ` +
            `Average: ${result.chunkingResult.statistics.averageChunkSize} chars, ` +
            `Min: ${result.chunkingResult.statistics.minChunkSize} chars, ` +
            `Max: ${result.chunkingResult.statistics.maxChunkSize} chars, ` +
            `Overlap: ${result.chunkingResult.statistics.actualOverlapPercentage.toFixed(1)}%`,
        );
      } else {
        this.logger.error(
          `Error processing chunks for document ${documentId}: ` +
            `${result.errors?.join(', ')}`,
        );
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error processing chunks for document ${documentId}: ${errorMessage}`,
      );

      // Return structured error result
      return {
        chunkingResult: {
          chunks: [],
          totalChunks: 0,
          statistics: {
            averageChunkSize: 0,
            minChunkSize: 0,
            maxChunkSize: 0,
            actualOverlapPercentage: 0,
          },
        },
        savedChunks: [],
        processingTimeMs: 0,
        status: 'error',
        errors: [errorMessage],
      };
    }
  }

  /**
   * Check if document already has processed chunks
   */
  async hasProcessedChunks(documentId: string): Promise<boolean> {
    try {
      return await this.chunkingService.hasProcessedChunks(documentId);
    } catch (error) {
      this.logger.error(
        `Error checking chunks for document ${documentId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Reprocess chunks of an existing document
   */
  async reprocessChunks(documentId: string): Promise<ProcessChunksResult> {
    return this.execute({
      documentId,
      replaceExisting: true,
    });
  }
}
