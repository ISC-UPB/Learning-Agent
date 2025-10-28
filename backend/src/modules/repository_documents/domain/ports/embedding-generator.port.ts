/**
 * Result of embedding generation
 */
export interface EmbeddingResult {
  /** Generated embedding vector */
  embedding: number[];

  /** Vector dimensions */
  dimensions: number;

  /** Model used to generate the embedding */
  model: string;

  /** Number of tokens processed */
  tokensUsed: number;

  /** Processing time in milliseconds */
  processingTimeMs?: number;
}

/**
 * Result of batch embedding generation
 */
export interface BatchEmbeddingResult {
  /** Generated embedding vectors */
  embeddings: number[][];

  /** Total number of embeddings generated */
  totalEmbeddings: number;

  /** Vector dimensions */
  dimensions: number;

  /** Total tokens used */
  totalTokensUsed: number;

  /** Model used */
  model: string;

  /** Number of successful embeddings */
  successfulCount: number;

  /** Number of failed embeddings */
  failedCount: number;

  /** List of errors found */
  errors: string[];
}

/**
 * Configuration for embedding generation
 */
export interface EmbeddingConfig {
  /** Model to use (e.g: text-embedding-3-small, text-embedding-3-large) */
  model: string;

  /** Vector dimensions (optional, depends on the model) */
  dimensions: number;

  /** Additional provider-specific configuration */
  additionalConfig?: Record<string, any>;
}

/**
 * Embedding generator port
 *
 * Abstracts different embedding providers (OpenAI, Hugging Face, etc.)
 */
export interface EmbeddingGeneratorPort {
  /**
   * Generates embedding for a single text
   *
   * @param text - Text to process
   * @param config - Optional configuration
   * @returns Result with the embedding vector
   */
  generateEmbedding(
    text: string,
    config?: Partial<EmbeddingConfig>,
  ): Promise<EmbeddingResult>;

  /**
   * Generates embeddings for multiple texts in batch (more efficient)
   *
   * @param texts - Array of texts to process
   * @param config - Optional configuration
   * @returns Complete batch results
   */
  generateBatchEmbeddings(
    texts: string[],
    config?: Partial<EmbeddingConfig>,
  ): Promise<BatchEmbeddingResult>;

  /**
   * Validates that a text is appropriate for generating embeddings
   *
   * @param text - Text to validate
   * @returns true if valid, false otherwise
   */
  validateText(text: string): boolean;

  /**
   * Gets the default configuration of the generator
   */
  getDefaultConfig(): EmbeddingConfig;

  /**
   * Gets information about the model used
   */
  getModelInfo(): {
    name: string;
    dimensions: number;
    maxTokens: number;
    costPerToken?: number;
  };
}
