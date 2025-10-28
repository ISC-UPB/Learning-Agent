import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { DocumentStoragePort } from '../../domain/ports/document-storage.port';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';
import type { DocumentChunkRepositoryPort } from '../../domain/ports/document-chunk-repository.port';
import {
  DOCUMENT_STORAGE_PORT,
  DOCUMENT_REPOSITORY_PORT,
  DOCUMENT_CHUNK_REPOSITORY_PORT,
} from '../../tokens';
import { DocumentStatus } from '../../domain/entities/document.entity';

@Injectable()
export class StorageReconciliationService {
  private readonly logger = new Logger(StorageReconciliationService.name);

  constructor(
    @Inject(DOCUMENT_STORAGE_PORT)
    private readonly storageAdapter: DocumentStoragePort,
    @Inject(DOCUMENT_REPOSITORY_PORT)
    private readonly documentRepository: DocumentRepositoryPort,
    @Inject(DOCUMENT_CHUNK_REPOSITORY_PORT)
    private readonly chunkRepository: DocumentChunkRepositoryPort,
  ) {}

  /**
   * Run reconciliation job every 2 hours
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  async reconcileStorageAndDatabase() {
    this.logger.log('Starting storage reconciliation job...');

    try {
      // 1. Check for documents marked as active in DB but missing in storage
      await this.handleMissingStorageFiles();

      // 2. Check for documents marked as deleted but still in storage
      await this.handleOrphanedStorageFiles();

      this.logger.log('Storage reconciliation completed successfully');
    } catch (error) {
      this.logger.error(`Error during storage reconciliation: ${error.message}`);
    }
  }

  /**
   * Handle documents that exist in DB but are missing in storage
   */
  private async handleMissingStorageFiles() {
    // Check documents that are not in DELETED or ERROR state
    const activeDocuments = await this.documentRepository.findByStatus(DocumentStatus.PROCESSED);
    
    for (const document of activeDocuments) {
      try {
        const exists = await this.storageAdapter.exists(document.s3Key);
        
        if (!exists) {
          this.logger.warn(
            `Document ${document.id} exists in DB but missing in storage. Marking as ERROR.`,
          );
          
          // Mark document as error in DB
          await this.documentRepository.updateStatus(
            document.id,
            DocumentStatus.ERROR,
          );
          
          // Soft delete associated chunks
          await this.chunkRepository.softDeleteByDocumentId(document.id);
        }
      } catch (error) {
        this.logger.error(
          `Error checking storage for document ${document.id}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Handle files that exist in storage but shouldn't (deleted in DB)
   */
  private async handleOrphanedStorageFiles() {
    // Get all documents marked as deleted
    const deletedDocuments = await this.documentRepository.findByStatus(
      DocumentStatus.DELETED,
    );

    for (const document of deletedDocuments) {
      try {
        const exists = await this.storageAdapter.exists(document.s3Key);
        
        if (exists) {
          this.logger.warn(
            `Document ${document.id} marked as deleted but still exists in storage. Cleaning up.`,
          );
          
          // Remove from storage
          await this.storageAdapter.deleteFile(document.fileName);
        }
      } catch (error) {
        this.logger.error(
          `Error cleaning up deleted document ${document.id}: ${error.message}`,
        );
      }
    }
  }
}