import { Injectable } from '@nestjs/common';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';

export interface GetDocumentContentRequest {
  docId: string;
}

export interface GetDocumentContentResponse {
  contenido: string;
  metadata: {
    paginas?: number;
    resumen?: string;
  };
}

@Injectable()
export class GetDocumentContentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepositoryPort,
  ) {}

  async execute(
    request: GetDocumentContentRequest,
  ): Promise<GetDocumentContentResponse> {
    const { docId } = request;

    try {
      const document = await this.documentRepository.findById(docId);

      if (!document) {
        throw new Error(`Document with ID ${docId} not found`);
      }

      if (!document.extractedText) {
        throw new Error(
          `Document ${docId} has no extracted text content`,
        );
      }

      const response: GetDocumentContentResponse = {
        contenido: document.extractedText,
        metadata: {
          paginas: document.pageCount || 0,
          resumen: 'Summary not available',
        },
      };

      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Error getting document content ${docId}: ${errorMessage}`,
      );
    }
  }
}
