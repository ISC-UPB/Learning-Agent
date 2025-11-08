import { Document, DocumentStatus } from '../entities/document.entity';

export interface DocumentRepositoryPort {
  /**
   * Save a document in the database
   * @param document Document to save
   * @returns Saved document
   */
  save(document: Document): Promise<Document>;

  /**
   * Find a document by ID
   * @param id ID of the document
   * @returns Document found or undefined
   */
  findById(id: string): Promise<Document | undefined>;

  /**
   * Find a document by file hash
   * @param fileHash Hash SHA-256 of the file
   * @returns Document found or undefined
   */
  findByFileHash(fileHash: string): Promise<Document | undefined>;

  /**
   * Find a document by text hash
   * @param textHash Hash SHA-256 of the normalized text
   * @returns Document found or undefined
   */
  findByTextHash(textHash: string): Promise<Document | undefined>;

  /**
   * Find a document by S3 key
   * @param s3Key S3 key of the file
   * @returns Document found or undefined
   */
  findByS3Key(s3Key: string): Promise<Document | undefined>;

  /**
   * Find documents by status
   * @param status Document status
   * @returns List of documents with the specified status
   */
  findByStatus(status: DocumentStatus): Promise<Document[]>;

  /**
   * Find documents uploaded by a user
   * @param uploadedBy ID of the user
   * @returns List of documents uploaded by the user
   */
  findByUploadedBy(uploadedBy: string): Promise<Document[]>;

  /**
   * Update the status of a document
   * @param id ID of the document
   * @param status New status
   * @returns Updated document or undefined if it doesn't exist
   */
  updateStatus(
    id: string,
    status: DocumentStatus,
  ): Promise<Document | undefined>;

  /**
   * Update the extracted text of a document
   * @param id ID of the document
   * @param extractedText Extracted text
   * @param pageCount Number of pages (optional)
   * @param documentTitle Document title (optional)
   * @param documentAuthor Document author (optional)
   * @param language Document language (optional)
   * @returns Updated document or undefined if it doesn't exist
   */
  updateExtractedText(
    id: string,
    extractedText: string,
    pageCount?: number,
    documentTitle?: string,
    documentAuthor?: string,
    language?: string,
  ): Promise<Document | undefined>;

  /**
   * Delete a document from the database
   * @param id ID of the document
   * @returns true if deleted, false if it didn't exist
   */
  delete(id: string): Promise<boolean>;

  /**
   * Find all documents with pagination
   * @param offset Number of records to skip
   * @param limit Maximum number of records to return
   * @returns List of documents
   */
  findAll(offset?: number, limit?: number): Promise<Document[]>;

  /**
   * Find documents with optional filters by course and/or class
   * @param filters Optional filters
   * @param offset Number of records to skip
   * @param limit Maximum number of records to return
   * @returns List of filtered documents
   */
  findWithFilters(
    filters?: { courseId?: string; classId?: string },
    offset?: number,
    limit?: number,
  ): Promise<Document[]>;

  /**
   * Count the total number of documents
   * @returns Total number of documents
   */
  count(): Promise<number>;

  /**
   * Count documents by status
   * @param status Document status
   * @returns Number of documents with the specified status
   */
  countByStatus(status: DocumentStatus): Promise<number>;

  /**
   * Find documents by course ID with pagination
   * @param courseId Course ID
   * @param offset Number of records to skip
   * @param limit Maximum number of records to return
   * @param tipo Optional file type filter
   * @returns List of documents from the course
   */
  findByCourseId(
    courseId: string,
    offset?: number,
    limit?: number,
    tipo?: string,
  ): Promise<Document[]>;

  /**
   * Count documents by course ID
   * @param courseId Course ID
   * @param tipo Optional file type filter
   * @returns Number of documents from the course
   */
  countByCourseId(courseId: string, tipo?: string): Promise<number>;

  /**
   * Associate a document with a course
   * @param documentId Document ID
   * @param courseId Course ID
   * @returns Updated document or undefined if it doesn't exist
   */
  associateWithCourse(
    documentId: string,
    courseId: string,
  ): Promise<Document | undefined>;

  /**
   * Restore document status in case of rollback
   * @param id ID of the document
   * @param previousStatus Previous status to restore
   * @returns Restored document
   */
  restoreStatus(
    id: string,
    previousStatus: DocumentStatus,
  ): Promise<Document | undefined>;
}
