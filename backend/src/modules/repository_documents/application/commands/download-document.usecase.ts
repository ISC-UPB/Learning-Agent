import { Injectable, NotFoundException } from '@nestjs/common';
import type { DocumentStoragePort } from '../../domain/ports/document-storage.port';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';

@Injectable()
export class DownloadDocumentUseCase {
  constructor(
    private readonly storageAdapter: DocumentStoragePort,
    private readonly documentRepository: DocumentRepositoryPort,
  ) {}

  /**
   * Generate download URL for document with specified ID
   * Throws NotFoundException if document does not exist
   */
  async execute(documentId: string): Promise<string> {
    // Find document by ID in database
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException(`Document with ID "${documentId}" not found`);
    }

    // Validate existence in storage
    const exists = await this.storageAdapter.documentExists(document.fileName);
    if (!exists) {
      throw new NotFoundException(
        `Document file "${document.originalName}" not found in storage`,
      );
    }

    // Generate URL (presigned url or other strategy implemented by adapter)
    const url = await this.storageAdapter.generateDownloadUrl(
      document.fileName,
    );

    if (!url) {
      throw new Error(
        `Could not generate download URL for document "${document.originalName}"`,
      );
    }

    return url;
  }
}
