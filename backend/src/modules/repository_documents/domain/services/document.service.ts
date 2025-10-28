import { Document, DocumentStatus } from '../entities/document.entity';

export class DocumentService {
  /**
   * Creates a new document
   */
  static create(
    id: string,
    fileName: string,
    originalName: string,
    mimeType: string,
    size: number,
    url: string,
    s3Key: string,
    fileHash: string,
    uploadedBy: string,
    courseId?: string,
    classId?: string,
  ): Document {
    return new Document(
      id,
      fileName,
      originalName,
      mimeType,
      size,
      url,
      s3Key,
      fileHash,
      uploadedBy,
      DocumentStatus.UPLOADED,
      undefined, // extractedText
      undefined, // textHash
      undefined, // pageCount
      undefined, // documentTitle
      undefined, // documentAuthor
      undefined, // language
      courseId,
      classId,
    );
  }

  /**
   * Updates document with extracted text
   */
  static withExtractedText(
    document: Document,
    extractedText: string,
    textHash?: string,
    pageCount?: number,
    documentTitle?: string,
    documentAuthor?: string,
    language?: string,
  ): Document {
    return new Document(
      document.id,
      document.fileName,
      document.originalName,
      document.mimeType,
      document.size,
      document.url,
      document.s3Key,
      document.fileHash,
      document.uploadedBy,
      document.status,
      extractedText,
      textHash,
      pageCount,
      documentTitle,
      documentAuthor,
      language,
      document.courseId,
      document.classId,
      document.uploadedAt,
      new Date(),
    );
  }

  /**
   * Updates document status
   */
  static withStatus(document: Document, status: DocumentStatus): Document {
    return new Document(
      document.id,
      document.fileName,
      document.originalName,
      document.mimeType,
      document.size,
      document.url,
      document.s3Key,
      document.fileHash,
      document.uploadedBy,
      status,
      document.extractedText,
      document.textHash,
      document.pageCount,
      document.documentTitle,
      document.documentAuthor,
      document.language,
      document.courseId,
      document.classId,
      document.uploadedAt,
      new Date(),
    );
  }

  /**
   * Updates document text hash
   */
  static withTextHash(document: Document, textHash: string): Document {
    return new Document(
      document.id,
      document.fileName,
      document.originalName,
      document.mimeType,
      document.size,
      document.url,
      document.s3Key,
      document.fileHash,
      document.uploadedBy,
      document.status,
      document.extractedText,
      textHash,
      document.pageCount,
      document.documentTitle,
      document.documentAuthor,
      document.language,
      document.courseId,
      document.classId,
      document.uploadedAt,
      new Date(),
    );
  }

  /**
   * Checks if document is ready for processing
   */
  static isReadyForProcessing(document: Document): boolean {
    return document.status === DocumentStatus.UPLOADED;
  }

  /**
   * Checks if document has been fully processed
   */
  static isProcessed(document: Document): boolean {
    return document.status === DocumentStatus.PROCESSED;
  }

  /**
   * Checks if document has extracted text
   */
  static hasExtractedText(document: Document): boolean {
    return Boolean(
      document.extractedText && document.extractedText.trim().length > 0,
    );
  }

  /**
   * Validates if document can change status
   */
  static canChangeStatus(
    document: Document,
    newStatus: DocumentStatus,
  ): boolean {
    const validTransitions: Record<DocumentStatus, DocumentStatus[]> = {
      [DocumentStatus.UPLOADED]: [
        DocumentStatus.PROCESSING,
        DocumentStatus.ERROR,
        DocumentStatus.DELETED,
      ],
      [DocumentStatus.PROCESSING]: [
        DocumentStatus.PROCESSED,
        DocumentStatus.ERROR,
        DocumentStatus.DELETED,
      ],
      [DocumentStatus.PROCESSED]: [
        DocumentStatus.PROCESSING,
        DocumentStatus.DELETED,
      ],
      [DocumentStatus.ERROR]: [
        DocumentStatus.PROCESSING,
        DocumentStatus.DELETED,
      ],
      [DocumentStatus.DELETED]: [],
    };

    return validTransitions[document.status]?.includes(newStatus) ?? false;
  }

  /**
   * Validates basic document data
   */
  static validateDocumentData(
    fileName: string,
    originalName: string,
    mimeType: string,
    size: number,
    uploadedBy: string,
  ): void {
    if (!fileName || fileName.trim().length === 0) {
      throw new Error('File name is required');
    }
    if (!originalName || originalName.trim().length === 0) {
      throw new Error('Original name is required');
    }
    if (!mimeType || mimeType.trim().length === 0) {
      throw new Error('MIME type is required');
    }
    if (size <= 0) {
      throw new Error('File size must be greater than 0');
    }
    if (!uploadedBy || uploadedBy.trim().length === 0) {
      throw new Error('Uploaded by is required');
    }
  }
}
