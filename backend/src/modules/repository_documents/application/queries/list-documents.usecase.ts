import { Injectable, Logger } from '@nestjs/common';
import type { DocumentStoragePort } from '../../domain/ports/document-storage.port';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';
import {
  DocumentListResponse,
  DocumentListItem,
} from '../../domain/value-objects/upload-document.vo';

@Injectable()
export class ListDocumentsUseCase {
  private readonly logger = new Logger(ListDocumentsUseCase.name);

  constructor(
    private readonly documentStorage: DocumentStoragePort,
    private readonly documentRepository: DocumentRepositoryPort,
  ) {}

  /**
   * Executes use case to list documents
   */
  async execute(filters?: {
    courseId?: string;
    classId?: string;
  }): Promise<DocumentListResponse> {
    try {
      const dbDocuments =
        filters?.courseId || filters?.classId
          ? await this.documentRepository.findWithFilters(filters)
          : await this.documentRepository.findAll();
      const documents: DocumentListItem[] = [];

      for (const doc of dbDocuments) {
        try {
          const exists = await this.documentStorage.documentExists(
            doc.fileName,
          );
          if (!exists) continue;

          const downloadUrl = await this.documentStorage.generateDownloadUrl(
            doc.fileName,
          );

          documents.push(
            new DocumentListItem(
              doc.id,
              doc.fileName,
              doc.originalName,
              doc.mimeType,
              doc.size,
              downloadUrl,
              doc.uploadedAt,
              doc.courseId,
              doc.classId,
            ),
          );
        } catch (error) {
          this.logger.error(`Error processing document ${doc.id}:`, error);
        }
      }

      return new DocumentListResponse(documents, documents.length);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes('NoSuchBucket') ||
        errorMessage.includes('bucket does not exist')
      ) {
        throw new Error(
          'Document bucket not found. Check MinIO configuration.',
        );
      }

      if (
        errorMessage.includes('connection') ||
        errorMessage.includes('ECONNREFUSED')
      ) {
        throw new Error('MinIO connection error. Verify service is available.');
      }
      throw new Error(`Error listing documents: ${errorMessage}`);
    }
  }
}
