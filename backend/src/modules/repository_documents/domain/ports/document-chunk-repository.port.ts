import type { DocumentChunk } from '../entities/document-chunk.entity';

/**
 * Search results for chunks
 */
export interface FindChunksResult {
  chunks: DocumentChunk[];
  total: number;
}

/**
 * Options for chunk search
 */
export interface FindChunksOptions {
  /** Result limit */
  limit?: number;

  /** Offset for pagination */
  offset?: number;

  /** Order by specific field */
  orderBy?: 'chunkIndex' | 'createdAt' | 'contentLength';

  /** Order direction */
  orderDirection?: 'asc' | 'desc';
}

/**
 * Repository port for DocumentChunk operations
 */
export interface DocumentChunkRepositoryPort {
  /**
   * Save a chunk in the repository
   */
  save(chunk: DocumentChunk): Promise<DocumentChunk>;

  /**
   * Save multiple chunks in a single operation (more efficient)
   */
  saveMany(chunks: DocumentChunk[]): Promise<DocumentChunk[]>;

  /**
   * Find a chunk by its ID
   */
  findById(id: string): Promise<DocumentChunk | null>;

  /**
   * Find all chunks of a specific document
   */
  findByDocumentId(
    documentId: string,
    options?: FindChunksOptions,
  ): Promise<FindChunksResult>;

  /**
   * Find chunks by type
   */
  findByType(
    type: string,
    options?: FindChunksOptions,
  ): Promise<FindChunksResult>;

  /**
   * Delete all chunks of a specific document
   */
  deleteByDocumentId(documentId: string): Promise<void>;

  /**
   * Soft delete all chunks of a specific document
   */
  softDeleteByDocumentId(documentId: string): Promise<void>;

  /**
   * Restore all deleted chunks of a specific document
   */
  restoreByDocumentId(documentId: string): Promise<void>;

  /**
   * Delete a specific chunk
   */
  deleteById(id: string): Promise<void>;

  /**
   * Count the total number of chunks for a specific document
   */
  countByDocumentId(documentId: string): Promise<number>;

  /**
   * Verify if chunks exist for a specific document
   */
  existsByDocumentId(documentId: string): Promise<boolean>;

  /**
   * Get statistics for chunks of a specific document
   */
  getDocumentChunkStatistics(documentId: string): Promise<{
    totalChunks: number;
    averageChunkSize: number;
    minChunkSize: number;
    maxChunkSize: number;
    totalContentLength: number;
  }>;

  /**
   * Update the embedding of a specific chunk
   * @param chunkId ID del chunk a actualizar
   * @param embedding Vector de embedding
   */
  updateChunkEmbedding(chunkId: string, embedding: number[]): Promise<void>;

  /**
   * Update embeddings of multiple chunks in batch
   * @param updates Array of updates with chunkId and embedding
   */
  updateBatchEmbeddings(
    updates: Array<{ chunkId: string; embedding: number[] }>,
  ): Promise<void>;

  /**
   * Verify if a chunk has an embedding generated
   * @param chunkId ID of the chunk to verify
   */
  hasEmbedding(chunkId: string): Promise<boolean>;

  /**
   * Find chunks that do not have embeddings generated for a document
   * @param documentId ID of the document
   * @param options Search options
   */
  findChunksWithoutEmbeddings(
    documentId: string,
    options?: FindChunksOptions,
  ): Promise<FindChunksResult>;
}
