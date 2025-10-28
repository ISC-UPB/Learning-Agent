import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';
import type { DeletedDocumentRepositoryPort } from '../../domain/ports/deleted-document-repository.port';
import type { TextExtractionPort } from '../../domain/ports/text-extraction.port';
import type { DocumentStoragePort } from '../../domain/ports/document-storage.port';
import type { DocumentChunkRepositoryPort } from '../../domain/ports/document-chunk-repository.port';
import {
  CheckDeletedDocumentRequest,
  DeletedDocumentCheckResult,
} from '../../domain/value-objects/deleted-document-check.vo';
import { DocumentStatus } from '../../domain/entities/document.entity';

@Injectable()
export class CheckDeletedDocumentUseCase {
  private readonly logger = new Logger(CheckDeletedDocumentUseCase.name);

  constructor(
    private readonly documentRepository: DocumentRepositoryPort,
    private readonly deletedDocumentRepository: DeletedDocumentRepositoryPort,
    private readonly textExtraction: TextExtractionPort,
    private readonly documentStorage: DocumentStoragePort,
    private readonly chunkRepository: DocumentChunkRepositoryPort,
  ) {}

  async execute(
    request: CheckDeletedDocumentRequest,
  ): Promise<DeletedDocumentCheckResult> {
    try {
      this.logger.log('Checking deleted document');

      // Step 1: Check exact binary hash against deleted documents
      const fileHash = this.generateFileHash(request.file);
      this.logger.log(`Generated file hash: ${fileHash}`);

      const exactDeletedMatch =
        await this.deletedDocumentRepository.findDeletedByFileHash(fileHash);

      if (exactDeletedMatch) {
        this.logger.log(
          `Found deleted document with exact hash: ${exactDeletedMatch.id}`,
        );

        // If auto-restore is enabled, restore automatically
        if (request.options?.autoRestore) {
          return await this.restoreDeletedDocument(
            exactDeletedMatch,
            request.uploadedBy,
          );
        }

        return DeletedDocumentCheckResult.exactMatch(exactDeletedMatch);
      } else {
        this.logger.log(
          `No deleted document found with binary hash: ${fileHash}`,
        );
      }

      // Step 2: Check text hash if text extraction should not be skipped
      if (!request.options?.skipTextExtraction) {
        const extractedText = await this.textExtraction.extractTextFromPdf(
          request.file,
          request.originalName,
        );

        const textHash = this.generateTextHash(extractedText.content);
        const textDeletedMatch =
          await this.deletedDocumentRepository.findDeletedByTextHash(textHash);

        if (textDeletedMatch) {
          this.logger.log(
            `Found deleted document with text hash: ${textDeletedMatch.id}`,
          );

          // If auto-restore is enabled, restore automatically
          if (request.options?.autoRestore) {
            return await this.restoreDeletedDocument(
              textDeletedMatch,
              request.uploadedBy,
            );
          }

          return DeletedDocumentCheckResult.textMatch(textDeletedMatch);
        }
      }

      // Step 3: No similar deleted documents found
      this.logger.log('No reusable deleted documents found');
      return DeletedDocumentCheckResult.noMatch();
    } catch (error) {
      this.logger.error(`Error checking deleted document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Restore a deleted document
   */
  async restoreDeletedDocument(
    deletedDocument: any,
    _restoredBy: string,
  ): Promise<DeletedDocumentCheckResult> {
    try {
      this.logger.log(`Starting document restoration: ${deletedDocument.id}`);
      this.logger.debug('Document to restore:', {
        id: deletedDocument.id,
        fileName: deletedDocument.fileName,
        s3Key: deletedDocument.s3Key,
        status: deletedDocument.status,
      });

      // Step 1: Verify that file still exists in deleted folder of bucket
      const deletedS3Key = `deleted/${deletedDocument.fileName}`; // Use fileName instead of s3Key
      this.logger.log(`Checking deleted file existence: ${deletedS3Key}`);

      const exists = await this.documentStorage.exists(deletedS3Key);

      if (!exists) {
        this.logger.error(`Deleted file not found in storage: ${deletedS3Key}`);
        throw new Error(`Deleted file not found in storage: ${deletedS3Key}`);
      }

      this.logger.log(`Deleted file found, proceeding to move`);

      // Step 2: Move file from deleted/ back to original location
      const originalS3Key = deletedDocument.fileName; // Original location is fileName directly
      this.logger.log(`Moving file from ${deletedS3Key} to ${originalS3Key}`);

      await this.documentStorage.moveFile(deletedS3Key, originalS3Key);
      this.logger.log(`File moved successfully`);

      // Step 3: Update document status to UPLOADED
      this.logger.log(`Updating document status in DB: ${deletedDocument.id}`);
      const restoredDocument =
        await this.deletedDocumentRepository.restoreDocument(
          deletedDocument.id,
        );

      // Step 4: Restore deleted chunks
      this.logger.log(
        `Restoring deleted chunks for document: ${deletedDocument.id}`,
      );
      await this.chunkRepository.restoreByDocumentId(deletedDocument.id);
      this.logger.log(`Chunks restored successfully`);

      if (!restoredDocument) {
        this.logger.error(
          `Failed updating document status: ${deletedDocument.id}`,
        );
        throw new Error(`Could not restore document: ${deletedDocument.id}`);
      }

      this.logger.log(`Document restored successfully: ${restoredDocument.id}`);
      this.logger.debug(`Restored document:`, {
        id: restoredDocument.id,
        fileName: restoredDocument.fileName,
        status: restoredDocument.status,
      });

      return DeletedDocumentCheckResult.restored(
        deletedDocument,
        restoredDocument,
      );
    } catch (error) {
      this.logger.error(
        `Error restoring document ${deletedDocument.id}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generate SHA-256 hash of file content
   */
  private generateFileHash(fileBuffer: Buffer): string {
    return createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Generate hash of normalized text
   */
  private generateTextHash(text: string): string {
    // Normalize text: lowercase, remove extra spaces and normalize line breaks
    const normalizedText = text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\r\n/g, '\n')
      .trim();

    return createHash('sha256').update(normalizedText, 'utf8').digest('hex');
  }

  /**
   * Restore a specific deleted document by its ID
   */
  async restoreDocumentById(
    documentId: string,
    restoredBy: string,
  ): Promise<{ success: boolean; message?: string; document?: any }> {
    try {
      this.logger.log(`Starting manual document restoration: ${documentId}`);

      // Find deleted document using general repository
      // (since we have documents with DELETED status)
      const deletedDocument =
        await this.documentRepository.findById(documentId);

      if (
        !deletedDocument ||
        deletedDocument.status !== DocumentStatus.DELETED
      ) {
        this.logger.warn(`Document not found or not deleted: ${documentId}`);
        return {
          success: false,
          message: 'Document not found or not deleted',
        };
      }

      this.logger.log(
        `Deleted document found, starting restoration: ${documentId}`,
      );

      // Use complete restoration logic
      const result = await this.restoreDeletedDocument(
        deletedDocument,
        restoredBy,
      );

      if (result.status === 'restored' && result.restoredDocument) {
        return {
          success: true,
          message: 'Document restored successfully',
          document: result.restoredDocument,
        };
      } else {
        return {
          success: false,
          message: 'Error during document restoration',
        };
      }
    } catch (error) {
      this.logger.error(`Error in manual restoration: ${error.message}`);
      return {
        success: false,
        message: `Error during restoration: ${error.message}`,
      };
    }
  }
}
