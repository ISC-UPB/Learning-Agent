import OpenAI from 'openai';
import { Logger } from '@nestjs/common';
import type {
  EmbeddingGeneratorPort,
  EmbeddingConfig,
  EmbeddingResult,
  BatchEmbeddingResult,
} from '../../domain/ports/embedding-generator.port';

/**
 * OpenAI specific configuration
 */
export interface OpenAIConfig {
  /** OpenAI API key */
  apiKey: string;

  /** API base URL (optional) */
  baseURL?: string;

  /** Organization (optional) */
  organization?: string;

  /** Project (optional) */
  project?: string;

  /** Timeout in milliseconds */
  timeout?: number;

  /** Maximum number of retries */
  maxRetries?: number;
}

/**
 * Available embedding models in OpenAI
 */
export enum OpenAIEmbeddingModel {
  TEXT_EMBEDDING_3_SMALL = 'text-embedding-3-small',
  TEXT_EMBEDDING_3_LARGE = 'text-embedding-3-large',
  TEXT_EMBEDDING_ADA_002 = 'text-embedding-ada-002',
}

/**
 * Dimensions supported by each model
 */
export const MODEL_DIMENSIONS = {
  [OpenAIEmbeddingModel.TEXT_EMBEDDING_3_SMALL]: [512, 1536], // Default: 1536
  [OpenAIEmbeddingModel.TEXT_EMBEDDING_3_LARGE]: [256, 1024, 3072], // Default: 3072
  [OpenAIEmbeddingModel.TEXT_EMBEDDING_ADA_002]: [1536], // Fixed: 1536
} as const;

/**
 * Token limits per model
 */
export const MODEL_TOKEN_LIMITS = {
  [OpenAIEmbeddingModel.TEXT_EMBEDDING_3_SMALL]: 8191,
  [OpenAIEmbeddingModel.TEXT_EMBEDDING_3_LARGE]: 8191,
  [OpenAIEmbeddingModel.TEXT_EMBEDDING_ADA_002]: 8191,
} as const;

/**
 * Configuration constants for embedding processing
 */
const EMBEDDING_PROCESSING_CONFIG = {
  /** Maximum batch size for OpenAI (inputs per request) */
  MAX_BATCH_SIZE: 2048,

  /** Conservative token limit for batch processing */
  MAX_TOKENS_PER_BATCH: 250000,

  /** Delay between batches to avoid rate limiting (ms) */
  BATCH_DELAY_MS: 150,

  /** Characters per token for approximate estimation */
  CHARS_PER_TOKEN: 4,

  /** Maximum character limit before tokenization */
  MAX_TEXT_LENGTH: 50000,
} as const;

/**
 * Adapter for embedding generation using OpenAI
 *
 * Implements the EmbeddingGeneratorPort interface using
 * OpenAI embedding models
 */
export class OpenAIEmbeddingAdapter implements EmbeddingGeneratorPort {
  private readonly client: OpenAI;
  private readonly defaultConfig: Required<EmbeddingConfig>;
  private readonly logger = new Logger(OpenAIEmbeddingAdapter.name);

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
      project: config.project,
      timeout: config.timeout || 60000, // 60 seconds
      maxRetries: config.maxRetries || 3,
    });

    // Default configuration
    this.defaultConfig = {
      model: OpenAIEmbeddingModel.TEXT_EMBEDDING_3_SMALL,
      dimensions: 1536,
      additionalConfig: {},
    };
  }

  /**
   * Generate embedding for individual text
   */
  async generateEmbedding(
    text: string,
    config?: Partial<EmbeddingConfig>,
  ): Promise<EmbeddingResult> {
    try {
      // 1. Validate input
      this.validateText(text);

      // 2. Prepare configuration
      const finalConfig = this.mergeConfig(config);

      // 3. Call OpenAI
      const response = await this.client.embeddings.create({
        model: finalConfig.model,
        input: text,
        dimensions: this.shouldIncludeDimensions(finalConfig.model)
          ? finalConfig.dimensions
          : undefined,
        encoding_format: 'float',
        ...finalConfig.additionalConfig,
      });

      // 4. Procesar respuesta
      const embedding = response.data[0];
      if (!embedding || !embedding.embedding) {
        throw new Error('No valid embedding received from OpenAI');
      }

      return {
        embedding: embedding.embedding,
        dimensions: embedding.embedding.length,
        tokensUsed: response.usage.total_tokens,
        model: finalConfig.model,
      };
    } catch (error) {
      this.logger.error('Error generating embedding:', error);
      throw this.handleOpenAIError(error, 'generateEmbedding');
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(
    texts: string[],
    config?: Partial<EmbeddingConfig>,
  ): Promise<BatchEmbeddingResult> {
    try {
      // 1. Validate input
      if (!texts || texts.length === 0) {
        throw new Error('At least one text is required for processing');
      }

      // 2. If too many texts, process in batches
      if (texts.length > 2048) {
        this.logger.log(
          `Processing ${texts.length} texts in batches (maximum 2048 per batch)`,
        );
        return await this.processBatchesSequentially(texts, config);
      }

      // 3. Estimate tokens to avoid exceeding the limit
      const estimatedTokens = this.estimateTokens(texts);

      if (estimatedTokens > EMBEDDING_PROCESSING_CONFIG.MAX_TOKENS_PER_BATCH) {
        this.logger.log(
          `Estimated tokens (${estimatedTokens}) exceed limit (${EMBEDDING_PROCESSING_CONFIG.MAX_TOKENS_PER_BATCH}). Processing in smaller batches.`,
        );
        return await this.processBatchesByTokenLimit(
          texts,
          EMBEDDING_PROCESSING_CONFIG.MAX_TOKENS_PER_BATCH,
          config,
        );
      }

      // Validate each text
      texts.forEach((text, index) => {
        try {
          this.validateText(text);
        } catch (error) {
          throw new Error(
            `Invalid text at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      });

      // 4. Prepare configuration

      const finalConfig = this.mergeConfig(config);

      // 5. Call OpenAI
      const response = await this.client.embeddings.create({
        model: finalConfig.model,
        input: texts,
        dimensions: this.shouldIncludeDimensions(finalConfig.model)
          ? finalConfig.dimensions
          : undefined,
        encoding_format: 'float',
        ...finalConfig.additionalConfig,
      });

      // 4. Process response
      if (!response.data || response.data.length !== texts.length) {
        throw new Error(
          `Number of embeddings received (${response.data?.length || 0}) does not match texts sent (${texts.length})`,
        );
      }

      const embeddings = response.data.map((item) => ({
        embedding: item.embedding,
        dimensions: item.embedding.length,
        index: item.index,
      }));

      // Sort by index to maintain correspondence
      embeddings.sort((a, b) => a.index - b.index);

      return {
        embeddings: embeddings.map((item) => item.embedding),
        totalEmbeddings: embeddings.length,
        dimensions: embeddings[0]?.dimensions || 0,
        totalTokensUsed: response.usage.total_tokens,
        model: finalConfig.model,
        successfulCount: embeddings.length,
        failedCount: 0,
        errors: [],
      };
    } catch (error) {
      this.logger.error('Error generating batch embeddings:', error);
      throw this.handleOpenAIError(error, 'generateBatchEmbeddings');
    }
  }

  /**
   * Validate if text is suitable for generating embeddings
   */
  validateText(text: string): boolean {
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a valid non-empty string');
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      throw new Error('Text cannot be empty');
    }

    if (trimmed.length > EMBEDDING_PROCESSING_CONFIG.MAX_TEXT_LENGTH) {
      // Approximate limit before tokenization
      throw new Error('Text is too long to process');
    }

    return true;
  }

  /**
   * Get information about available models
   */
  getAvailableModels(): string[] {
    return Object.values(OpenAIEmbeddingModel);
  }

  /**
   * Get dimensions supported by a model
   */
  getModelDimensions(model: string): number[] {
    if (model in MODEL_DIMENSIONS) {
      return [...MODEL_DIMENSIONS[model as OpenAIEmbeddingModel]];
    }
    return [1536]; // Default dimension
  }

  /**
   * Get token limit for a model
   */
  getModelTokenLimit(model: string): number {
    if (model in MODEL_TOKEN_LIMITS) {
      return MODEL_TOKEN_LIMITS[model as OpenAIEmbeddingModel];
    }
    return 8191; // Default limit
  }

  /**
   * Get default configuration
   */
  getDefaultConfig(): EmbeddingConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Get information about the model used
   */
  getModelInfo() {
    return {
      name: this.defaultConfig.model,
      dimensions: this.defaultConfig.dimensions,
      maxTokens: this.getModelTokenLimit(this.defaultConfig.model),
      costPerToken: 0.00002, // Approximate price of text-embedding-3-small
    };
  }

  // ============ PRIVATE METHODS ============

  /**
   * Combine the default settings with the provided ones
   */
  private mergeConfig(
    config?: Partial<EmbeddingConfig>,
  ): Required<EmbeddingConfig> {
    const merged = {
      ...this.defaultConfig,
      ...config,
    };

    // Validate model
    if (!this.getAvailableModels().includes(merged.model)) {
      throw new Error(`Model not supported: ${merged.model}`);
    }

    // Validate dimensions
    const supportedDimensions = this.getModelDimensions(merged.model);
    if (!supportedDimensions.includes(merged.dimensions)) {
      throw new Error(
        `Dimensions ${merged.dimensions} not supported for model ${merged.model}. Supported: ${supportedDimensions.join(', ')}`,
      );
    }

    return merged;
  }

  /**
   * Determine if the dimensions parameter should be included
   */
  private shouldIncludeDimensions(model: string): boolean {
    // text-embedding-ada-002 does not support the dimensions parameter
    return (
      (model as OpenAIEmbeddingModel) !==
      OpenAIEmbeddingModel.TEXT_EMBEDDING_ADA_002
    );
  }

  /**
   * Handle OpenAI errors and convert them to descriptive errors
   */
  private handleOpenAIError(error: unknown, operation: string): Error {
    if (error instanceof OpenAI.APIError) {
      const message = `OpenAI API error in ${operation}: ${error.message}`;

      switch (error.status) {
        case 401:
          return new Error(`${message} - Invalid or missing API key`);
        case 429:
          return new Error(`${message} - Rate limit exceeded, try again later`);
        case 400:
          return new Error(`${message} - Invalid request, check parameters`);
        case 500:
        case 502:
        case 503:
          return new Error(`${message} - OpenAI server error, try again later`);
        default:
          return new Error(message);
      }
    }

    if (error instanceof OpenAI.APIConnectionError) {
      return new Error(
        `OpenAI connection error in ${operation}: ${error.message}`,
      );
    }

    if (error instanceof OpenAI.RateLimitError) {
      return new Error(`Rate limit exceeded in ${operation}: ${error.message}`);
    }

    if (error instanceof Error) {
      return new Error(`Error in ${operation}: ${error.message}`);
    }

    return new Error(`Unknown error in ${operation}: ${String(error)}`);
  }

  /**
   * Estimate the number of tokens for an array of texts
   *
   * Note: This is an approximate estimation. For precise counting,
   * it is recommended to use tiktoken or another tokenization library.
   */
  private estimateTokens(texts: string[]): number {
    const totalChars = texts.reduce((sum, text) => {
      const trimmedText = text.trim();

      const spaceRatio = (text.match(/\s/g) || []).length / text.length;
      const spaceFactor = 1 + spaceRatio * 0.5;

      const punctuationRatio =
        (text.match(/[.,;:!?()[\]{}"'-]/g) || []).length / text.length;
      const punctuationFactor = 1 + punctuationRatio * 0.3;

      const adjustedLength =
        trimmedText.length * spaceFactor * punctuationFactor;

      return sum + adjustedLength;
    }, 0);

    return Math.ceil(totalChars / EMBEDDING_PROCESSING_CONFIG.CHARS_PER_TOKEN);
  }

  /**
   * Process texts in sequential batches respecting the MAX_BATCH_SIZE limit
   */
  private async processBatchesSequentially(
    texts: string[],
    config?: Partial<EmbeddingConfig>,
  ): Promise<BatchEmbeddingResult> {
    const batchSize = EMBEDDING_PROCESSING_CONFIG.MAX_BATCH_SIZE;
    const batches: string[][] = [];

    // Divide into batches
    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    this.logger.log(
      `Processing ${batches.length} batches of maximum ${batchSize} texts each`,
    );

    const allEmbeddings: number[][] = [];
    let totalTokensUsed = 0;
    let successfulCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      this.logger.debug(
        `Processing batch ${i + 1}/${batches.length} (${batch.length} texts)`,
      );

      try {
        // Recursive call but with smaller batch
        const batchResult = await this.generateBatchEmbeddings(batch, config);

        allEmbeddings.push(...batchResult.embeddings);
        totalTokensUsed += batchResult.totalTokensUsed;
        successfulCount += batchResult.successfulCount;
        failedCount += batchResult.failedCount;
        errors.push(...batchResult.errors);

        // Small pause between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        this.logger.error(`Error in batch ${i + 1}:`, error);
        failedCount += batch.length;
        errors.push(
          `Batch ${i + 1}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return {
      embeddings: allEmbeddings,
      totalEmbeddings: allEmbeddings.length,
      dimensions: allEmbeddings[0]?.length || 0,
      totalTokensUsed,
      model: this.mergeConfig(config).model,
      successfulCount,
      failedCount,
      errors,
    };
  }

  /**
   * Process texts in batches respecting the token limit
   */
  private async processBatchesByTokenLimit(
    texts: string[],
    maxTokens: number,
    config?: Partial<EmbeddingConfig>,
  ): Promise<BatchEmbeddingResult> {
    const batches: string[][] = [];
    let currentBatch: string[] = [];
    let currentTokens = 0;

    // Split into batches by token limit
    for (const text of texts) {
      const textTokens = this.estimateTokens([text]);

      if (currentTokens + textTokens > maxTokens && currentBatch.length > 0) {
        batches.push([...currentBatch]);
        currentBatch = [text];
        currentTokens = textTokens;
      } else {
        currentBatch.push(text);
        currentTokens += textTokens;
      }
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    this.logger.log(
      `Processing ${batches.length} batches by token limit (maximum ${maxTokens} tokens per batch)`,
    );

    const allEmbeddings: number[][] = [];
    let totalTokensUsed = 0;
    let successfulCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const estimatedTokens = this.estimateTokens(batch);
      this.logger.debug(
        `Processing batch ${i + 1}/${batches.length} (${batch.length} texts, ~${estimatedTokens} tokens)`,
      );

      try {
        // Recursive call but with smaller batch
        const batchResult = await this.generateBatchEmbeddings(batch, config);

        allEmbeddings.push(...batchResult.embeddings);
        totalTokensUsed += batchResult.totalTokensUsed;
        successfulCount += batchResult.successfulCount;
        failedCount += batchResult.failedCount;
        errors.push(...batchResult.errors);

        // Small pause between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (error) {
        this.logger.error(`Error in batch ${i + 1}:`, error);
        failedCount += batch.length;
        errors.push(
          `Batch ${i + 1}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return {
      embeddings: allEmbeddings,
      totalEmbeddings: allEmbeddings.length,
      dimensions: allEmbeddings[0]?.length || 0,
      totalTokensUsed,
      model: this.mergeConfig(config).model,
      successfulCount,
      failedCount,
      errors,
    };
  }
}
