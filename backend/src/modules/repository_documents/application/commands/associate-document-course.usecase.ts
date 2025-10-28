import { Injectable } from '@nestjs/common';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';

export interface AssociateDocumentToCourseRequest {
  documentId: string;
  courseId: string;
}

export interface AssociateDocumentToCourseResponse {
  success: boolean;
  message: string;
  documentId: string;
  courseId: string;
}

@Injectable()
export class AssociateDocumentToCourseUseCase {
  constructor(private readonly documentRepository: DocumentRepositoryPort) {}

  async execute(
    request: AssociateDocumentToCourseRequest,
  ): Promise<AssociateDocumentToCourseResponse> {
    const { documentId, courseId } = request;

    try {
      // Verify that document exists
      const document = await this.documentRepository.findById(documentId);
      if (!document) {
        return {
          success: false,
          message: `Document with ID ${documentId} not found`,
          documentId,
          courseId,
        };
      }

      // Associate document with course
      await this.documentRepository.associateWithCourse(documentId, courseId);

      return {
        success: true,
        message: 'Document successfully associated with course',
        documentId,
        courseId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        message: `Error associating document with course: ${errorMessage}`,
        documentId,
        courseId,
      };
    }
  }
}
