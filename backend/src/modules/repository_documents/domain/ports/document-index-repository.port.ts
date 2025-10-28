import { DocumentIndex } from '../entities/document-index.entity';

export interface DocumentIndexRepositoryPort {
  /**
   * Save a new document index in the database
   */
  save(documentIndex: DocumentIndex): Promise<DocumentIndex>;

  /**
   * Find an index by document ID
   */
  findByDocumentId(documentId: string): Promise<DocumentIndex | null>;

  /**
   * Find an index by ID
   */
  findById(id: string): Promise<DocumentIndex | null>;

  /**
   * Update an existing index
   */
  update(
    id: string,
    documentIndex: Partial<DocumentIndex>,
  ): Promise<DocumentIndex>;

  /**
   * Delete an index by document ID
   */
  deleteByDocumentId(documentId: string): Promise<void>;

  /**
   * List all indices with pagination
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    status?: string;
  }): Promise<{
    items: DocumentIndex[];
    total: number;
  }>;
}
