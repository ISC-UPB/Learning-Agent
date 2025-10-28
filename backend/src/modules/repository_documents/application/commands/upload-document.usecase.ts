import { Injectable, BadRequestException } from '@nestjs/common';
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
import { DocumentChunkService } from '../../domain/services/document-chunk.service';

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
}

@Injectable()
export class UploadDocumentUseCase {
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
    // Validate PDF file type
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException('File cannot be larger than 100MB');
    }

    // Generate SHA-256 hash of the file
    const fileHash = this.generateFileHash(file.buffer);
    // Check if a file with the same hash already exists
    const existingDocument =
      await this.documentRepository.findByFileHash(fileHash);
    if (existingDocument) {
      throw new BadRequestException('This file already exists in the system');
    }

    // Generate unique ID for the document
    const documentId = uuidv4();

    // Upload file to storage
    const uploadRequest = new UploadDocumentRequest(
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size,
    );

    const storageResult =
      await this.storageAdapter.uploadDocument(uploadRequest);

    // Create document entity for database
    const document = DocumentService.create(
      documentId,
      storageResult.fileName, // storedName
      file.originalname, // originalName
      file.mimetype,
      file.size,
      storageResult.url,
      storageResult.fileName, // s3Key (same as fileName in this case)
      fileHash,
      uploadedBy,
      options?.courseId,
      options?.classId,
    );

    // Save to database with rollback protection
    let savedDocument: Document;
    try {
      savedDocument = await this.documentRepository.save(document);
    } catch (error) {
      // Rollback: Delete the file from storage if database save fails
      await this.storageAdapter.deleteFile(storageResult.fileName, true);
      throw new Error(`Failed to save document to database: ${error.message}`);
    }

    // If we have pre-generated data, save it to avoid regeneration
    if (
      options?.reuseGeneratedData &&
      options.preGeneratedChunks &&
      options.preGeneratedEmbeddings
    ) {
      try {
        // Convert pre-generated chunks to DocumentChunk entities
        const documentChunks = options.preGeneratedChunks.map((chunk, index) =>
          DocumentChunkService.create(
            uuidv4(), // New unique ID for each chunk
            documentId, // Document ID
            chunk.content, // Chunk content
            index, // Chunk index
            'text', // Default type
            chunk.metadata || {}, // Chunk metadata
          ),
        );

        // Use chunking service to save chunks
        const savedChunks =
          await this.chunkingService['chunkRepository'].saveMany(
            documentChunks,
          );

        // Save embeddings for each chunk
        if (
          options.preGeneratedEmbeddings &&
          options.preGeneratedEmbeddings.length === savedChunks.length
        ) {
          const embeddingUpdates = savedChunks.map((chunk, index) => ({
            chunkId: chunk.id,
            embedding: options.preGeneratedEmbeddings![index],
          }));

          await this.chunkingService['chunkRepository'].updateBatchEmbeddings(
            embeddingUpdates,
          );
        }

        // Update document to mark it has extracted text
        if (options.extractedText) {
          let updatedDocument = DocumentService.withExtractedText(
            savedDocument,
            options.extractedText,
          );
          updatedDocument = DocumentService.withStatus(
            updatedDocument,
            DocumentStatus.PROCESSED,
          );

          await this.documentRepository.save(updatedDocument);
        }
      } catch {
        // Don't fail the complete upload for this, just log it
      }
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
