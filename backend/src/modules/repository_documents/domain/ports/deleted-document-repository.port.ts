import { Document } from '../entities/document.entity';

/**
 * Port for handling deleted documents
 */
export interface DeletedDocumentRepositoryPort {
  /**
   * Find a deleted document by its file hash
   */
  findDeletedByFileHash(fileHash: string): Promise<Document | undefined>;

  /**
   * Find a deleted document by its text hash
   */
  findDeletedByTextHash(textHash: string): Promise<Document | undefined>;

  /**
   * Find similar deleted documents by file or text hash
   */
  findSimilarDeletedDocuments(
    fileHash?: string,
    textHash?: string,
  ): Promise<Document[]>;

  /**
   * Restore a deleted document by moving its status from DELETED to UPLOADED
   */
  restoreDocument(documentId: string): Promise<Document | undefined>;

  /**
   * Get all deleted documents (paginated)
   */
  findAllDeleted(offset?: number, limit?: number): Promise<Document[]>;

  /**
   * Count the number of deleted documents
   */
  countDeleted(): Promise<number>;

  /**
   * Permanently delete a document (hard delete)
   */
  permanentlyDelete(documentId: string): Promise<boolean>;
}
