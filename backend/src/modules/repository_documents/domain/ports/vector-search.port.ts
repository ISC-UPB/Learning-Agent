/**
 * Chunk with similarity information
 */
export interface SearchResultChunk {
  id: string;
  documentId: string;
  content: string;
  type: string;
  chunkIndex: number;
  wordCount: number;
  charCount: number;
  startPosition: number;
  endPosition: number;
  similarityScore: number;
  documentTitle?: string;
  documentFileName?: string;
  documentFileSize?: number;
  documentContentType?: string;
  metadata?: any;
  createdAt: Date;
}

/**
 * Vector search result
 */
export interface VectorSearchResult {
  /** Chunks found ordered by relevance */
  chunks: SearchResultChunk[];

  /** Total number of results */
  totalResults: number;

  /** Search options applied */
  searchOptions: VectorSearchOptions;

  /** Processing time in ms */
  processingTimeMs: number;
}

/**
 * Semantic search result
 */
export interface SemanticSearchResult {
  /** Query used for the search */
  query: string;

  /** Embedding generated for the query */
  queryEmbedding: any; // EmbeddingResult - avoid circular import

  /** Vector search result */
  searchResult: VectorSearchResult;

  /** Total number of results */
  totalResults: number;

  /** Total processing time */
  processingTimeMs: number;
}

/**
 * Similar document found
 */
export interface SimilarDocument {
  /** Document ID */
  documentId: string;

  /** Document title */
  title?: string;

  /** Document file name */
  fileName?: string;

  /** Average similarity */
  averageSimilarity: number;

  /** Maximum similarity */
  maxSimilarity: number;

  /** Most relevant chunks */
  relevantChunks: SearchResultChunk[];

  /** Total number of chunks in the document */
  totalChunks: number;
}

/**
 * Search options
 */
export interface VectorSearchOptions {
  /** Maximum number of results to return */
  limit?: number;

  /** Minimum similarity threshold (0-1) */
  similarityThreshold?: number;

  /** Include metadata */
  includeMetadata?: boolean;

  /** Include full content */
  includeContent?: boolean;

  /** Document IDs to filter */
  documentIds?: string[];

  /** Chunk types to include */
  chunkTypes?: string[];

  /** Chunk IDs to exclude */
  excludeChunkIds?: string[];

  /** Document IDs to exclude */
  excludeDocumentIds?: string[];

  /** Group by document */
  groupByDocument?: boolean;

  /** Additional filters */
  additionalFilters?: Record<string, any>;
}

/**
 * Vector search port
 *
 * Defines the interface for performing similarity searches
 * using vector embeddings
 */
export interface VectorSearchPort {
  /**
   * Searches for similar chunks using an embedding vector
   */
  searchByVector(
    queryVector: number[],
    options?: VectorSearchOptions,
  ): Promise<VectorSearchResult>;

  /**
   * Searches for similar chunks by converting text to vector first
   */
  searchByText(
    query: string,
    options?: VectorSearchOptions,
  ): Promise<SemanticSearchResult>;

  /**
   * Finds similar chunks to a specific one
   */
  findSimilarChunks(
    chunkId: string,
    options?: VectorSearchOptions,
  ): Promise<VectorSearchResult>;

  /**
   * Finds similar documents to a specific one
   */
  findSimilarDocuments(
    documentId: string,
    options?: VectorSearchOptions,
  ): Promise<SimilarDocument[]>;
}
