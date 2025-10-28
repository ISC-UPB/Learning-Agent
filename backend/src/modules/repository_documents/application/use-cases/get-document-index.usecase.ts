import { Injectable, Logger } from '@nestjs/common';
import type { DocumentIndexRepositoryPort } from '../../domain/ports/document-index-repository.port';
import { DocumentIndex } from '../../domain/entities/document-index.entity';

export interface GetDocumentIndexCommand {
  documentId: string;
}

@Injectable()
export class GetDocumentIndexUseCase {
  private readonly logger = new Logger(GetDocumentIndexUseCase.name);

  constructor(
    private readonly documentIndexRepository: DocumentIndexRepositoryPort,
  ) {}

  async execute(
    command: GetDocumentIndexCommand,
  ): Promise<DocumentIndex | null> {
    const { documentId } = command;

    try {
      this.logger.log(`Getting saved index for document: ${documentId}`);

      const documentIndex =
        await this.documentIndexRepository.findByDocumentId(documentId);

      if (!documentIndex) {
        this.logger.warn(`No index found for document: ${documentId}`);
        return null;
      }

      this.logger.log(
        `Index found for document ${documentId}: ${documentIndex.title} (${documentIndex.chapters.length} chapters)`,
      );

      return documentIndex;
    } catch (error) {
      this.logger.error(
        `Error getting index for document ${documentId}:`,
        error instanceof Error ? error.stack : error,
      );
      throw new Error(
        `Error getting document index: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
