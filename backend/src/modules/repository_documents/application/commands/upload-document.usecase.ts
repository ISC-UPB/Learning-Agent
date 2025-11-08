import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { DocumentStoragePort } from '../../domain/ports/document-storage.port';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';
import {
  Document,
  DocumentStatus,
} from '../../domain/entities/document.entity';
import { UploadDocumentRequest } from '../../domain/value-objects/upload-document.vo';
import { DocumentChunkingService } from '../../domain/services/document-chunking.service';
import { DocumentService } from '../../domain/services/document.service';
import {
  DocumentNotSavedError,
  StorageRollbackError,
} from '../../../../shared/exceptions/document.exceptions';

/**
 * Options for reusing pre-generated data during upload
 */
export interface UploadWithPreGeneratedDataOptions {
  preGeneratedChunks?: Array<{
    content: string;
    metadata?: Record<string, any>;
  }>;
  preGeneratedEmbeddings?: number[][];
  extractedText?: string;
  reuseGeneratedData?: boolean;
  courseId?: string;
  classId?: string;
  documentIndex?: {
    title: string;
    chapters?: Array<{
      title: string;
      description?: string;
      order: number;
      subtopics?: Array<{
        title: string;
        description?: string;
        order: number;
      }>;
    }>;
  };
}

@Injectable()
export class UploadDocumentUseCase {
  private readonly logger = new Logger(UploadDocumentUseCase.name);

  constructor(
    private readonly storageAdapter: DocumentStoragePort,
    private readonly documentRepository: DocumentRepositoryPort,
    private readonly chunkingService: DocumentChunkingService,
  ) {}

  async execute(
    file: Express.Multer.File,
    uploadedBy: string,
    options?: UploadWithPreGeneratedDataOptions,
  ): Promise<Document> {
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      throw new BadRequestException('File cannot be larger than 100MB');
    }

    const fileHash = this.generateFileHash(file.buffer);
    const existingDocument =
      await this.documentRepository.findByFileHash(fileHash);
    if (existingDocument) {
      throw new BadRequestException('This file already exists in the system');
    }

    const documentId = uuidv4();

    const uploadRequest = new UploadDocumentRequest(
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size,
    );

    const storageResult =
      await this.storageAdapter.uploadDocument(uploadRequest);

    const document = DocumentService.create(
      documentId,
      storageResult.fileName,
      file.originalname,
      file.mimetype,
      file.size,
      storageResult.url,
      storageResult.fileName,
      fileHash,
      uploadedBy,
      options?.courseId,
      options?.classId,
    );

    let savedDocument: Document;
    try {
      if (
        options?.reuseGeneratedData &&
        options.preGeneratedChunks &&
        options.preGeneratedEmbeddings
      ) {
        const chunkData = options.preGeneratedChunks.map((chunk, index) => ({
          id: uuidv4(),
          content: chunk.content,
          chunkIndex: index,
          type: 'text',
          metadata: chunk.metadata || {},
        }));

        savedDocument =
          await this.documentRepository.saveWithChunksAndEmbeddings(
            document,
            chunkData,
            options.preGeneratedEmbeddings,
            options.extractedText,
            options.documentIndex,
          );

        this.logger.log(
          `Document ${documentId} saved atomically with ${chunkData.length} chunks, embeddings${options.documentIndex ? ' and index' : ''}`,
        );
      } else {
        savedDocument = await this.documentRepository.save(document);
        this.logger.log(`Document ${documentId} saved without pre-generated data`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to save document ${documentId} to database: ${error.message}`,
        error.stack,
      );

      try {
        await this.storageAdapter.softDeleteDocument(storageResult.fileName);
        this.logger.log(
          `Successfully rolled back storage for document ${documentId}`,
        );
      } catch (rollbackError) {
        this.logger.error(
          `Failed to rollback storage for document ${documentId}: ${rollbackError.message}`,
          rollbackError.stack,
        );
        throw new StorageRollbackError(
          `Database save failed and storage rollback also failed for document ${documentId}`,
          rollbackError,
        );
      }

      throw new DocumentNotSavedError(
        `Failed to save document ${documentId} to database: ${error.message}`,
        error,
      );
    }

    return savedDocument;
  }

  /**
   * Generate SHA-256 hash of the file
   */
  private generateFileHash(fileBuffer: Buffer): string {
    return createHash('sha256').update(fileBuffer).digest('hex');
  }
}
