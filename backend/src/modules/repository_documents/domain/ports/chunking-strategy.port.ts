import type { DocumentChunk } from '../entities/document-chunk.entity';

/**
 * Configuration settings for the chunking strategy
 */
export interface ChunkingConfig {
  /** Maximum chunk size in characters */
  maxChunkSize: number;

  /** Overlap between chunks to preserve context */
  overlap: number;

  /** Prioritize paragraph division */
  respectParagraphs: boolean;

  /** Prioritize sentence division */
  respectSentences: boolean;

  /** Minimum chunk size */
  minChunkSize: number;
}

/**
 * Result of the chunking process
 */
export interface ChunkingResult {
  /** List of generated chunks */
  chunks: DocumentChunk[];

  /** Total number of chunks created */
  totalChunks: number;

  /** Statistics of the process */
  statistics: {
    /** Average chunk size */
    averageChunkSize: number;

    /** Minimum chunk size */
    minChunkSize: number;

    /** Maximum chunk size */
    maxChunkSize: number;

    /** Actual overlap percentage */
    actualOverlapPercentage: number;
  };
}

/**
 * Port for different chunking strategies
 */
export interface ChunkingStrategyPort {
  /**
   * Splits text into chunks based on the implemented strategy
   *
   * @param documentId - ID of the document to which the chunks belong
   * @param text - Text to be split into chunks
   * @param config - Chunking configuration
   * @returns Chunking result with statistics
   */
  chunkText(
    documentId: string,
    text: string,
    config: ChunkingConfig,
  ): Promise<ChunkingResult>;

  /**
   * Validates the chunking configuration
   *
   * @param config - Configuration to validate
   * @returns true if valid, false otherwise
   */
  validateConfig(config: ChunkingConfig): boolean;

  /**
   * Gets the default configuration for this strategy
   */
  getDefaultConfig(): ChunkingConfig;
}
