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

        savedDocument = await this.documentRepository.saveWithChunksAndEmbeddings(
          document,
          chunkData,
          options.preGeneratedEmbeddings,
          options.extractedText,
        );
      } else {
        savedDocument = await this.documentRepository.save(document);
      }
    } catch (error) {
      await this.storageAdapter.softDeleteDocument(storageResult.fileName);
      throw new Error(`Failed to save document to database: ${error.message}`);
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
