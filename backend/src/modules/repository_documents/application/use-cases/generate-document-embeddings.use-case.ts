import { Injectable, Logger } from '@nestjs/common';
import { DocumentEmbeddingService } from '../../domain/services/document-embedding.service';
import type {
  DocumentEmbeddingOptions,
  DocumentEmbeddingResult,
} from '../../domain/services/document-embedding.service';

/**
 * DTO for embeddings generation request
 */
export interface GenerateDocumentEmbeddingsRequest {
  /** Document ID */
  documentId: string;

  /** Embeddings configuration */
  embeddingConfig?: {
    /** Model to use */
    model?: string;

    /** Embedding dimensions */
    dimensions?: number;

    /** Additional configuration */
    additionalConfig?: Record<string, any>;
  };

  /** Whether to replace existing embeddings */
  replaceExisting?: boolean;

  /** Batch size for processing */
  batchSize?: number;

  /** Filters for specific chunks */
  chunkFilters?: {
    chunkTypes?: string[];
    chunkIndices?: number[];
    minContentLength?: number;
  };
}

/**
 * Embedding generation result
 */
export interface GenerateDocumentEmbeddingsResponse {
  /** Indicates if the operation was successful */
  success: boolean;

  /** Detailed result */
  result?: DocumentEmbeddingResult;

  /** Error message if failed */
  error?: string;

  /** Error code */
  errorCode?: string;
}

/**
 * Use case for generating document embeddings
 *
 * Coordinates the complete process of generating vector embeddings
 * for all chunks of a specific document
 */
@Injectable()
export class GenerateDocumentEmbeddingsUseCase {
  private readonly logger = new Logger(GenerateDocumentEmbeddingsUseCase.name);

  constructor(
    private readonly documentEmbeddingService: DocumentEmbeddingService,
  ) {}

  /**
   * Execute embedding generation for a document
   *
   * @param request - Request with generation parameters
   */
  async execute(
    request: GenerateDocumentEmbeddingsRequest,
  ): Promise<GenerateDocumentEmbeddingsResponse> {
    try {
      // 1. Validate input
      this.validateRequest(request);

      // 2. Prepare options
      const options: DocumentEmbeddingOptions = {
        embeddingConfig: request.embeddingConfig
          ? {
              model: request.embeddingConfig.model,
              dimensions: request.embeddingConfig.dimensions,
              additionalConfig: request.embeddingConfig.additionalConfig,
            }
          : undefined,
        replaceExisting: request.replaceExisting ?? false,
        batchSize: request.batchSize ?? 20,
        chunkFilters: request.chunkFilters,
      };

      // 3. Generate embeddings
      const result =
        await this.documentEmbeddingService.generateDocumentEmbeddings(
          request.documentId,
          options,
        );

      // 4. Check for partial errors
      if (result.chunksWithErrors > 0) {
        this.logger.warn(
          `Some chunks had errors: ${result.chunksWithErrors}/${result.totalChunksProcessed + result.chunksWithErrors}`,
        );
      }

      return {
        success: true,
        result,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        'Error in GenerateDocumentEmbeddingsUseCase:',
        errorMessage,
      );

      return {
        success: false,
        error: errorMessage,
        errorCode: this.categorizeError(error),
      };
    }
  }

  // ============ PRIVATE METHODS ============

  /**
   * Validate embedding generation request
   */
  private validateRequest(request: GenerateDocumentEmbeddingsRequest): void {
    // Validate documentId
    if (!request.documentId || typeof request.documentId !== 'string') {
      throw new Error('Document ID is required and must be a valid string');
    }

    if (request.documentId.trim().length === 0) {
      throw new Error('Document ID cannot be empty');
    }

    // Validate batchSize
    if (request.batchSize !== undefined) {
      if (!Number.isInteger(request.batchSize) || request.batchSize < 1) {
        throw new Error('Batch size must be a positive integer');
      }

      if (request.batchSize > 2048) {
        throw new Error(
          'Batch size cannot be greater than 2048 (OpenAI limit)',
        );
      }
    }

    // Validate chunk filters
    if (request.chunkFilters) {
      if (request.chunkFilters.chunkIndices) {
        const invalidIndices = request.chunkFilters.chunkIndices.filter(
          (index) => !Number.isInteger(index) || index < 0,
        );

        if (invalidIndices.length > 0) {
          throw new Error('Chunk indices must be non-negative integers');
        }
      }

      if (request.chunkFilters.minContentLength !== undefined) {
        if (
          !Number.isInteger(request.chunkFilters.minContentLength) ||
          request.chunkFilters.minContentLength < 0
        ) {
          throw new Error(
            'Minimum content length must be a non-negative integer',
          );
        }
      }
    }

    // Validate embedding configuration
    if (request.embeddingConfig?.dimensions !== undefined) {
      if (
        !Number.isInteger(request.embeddingConfig.dimensions) ||
        request.embeddingConfig.dimensions < 1
      ) {
        throw new Error('Embedding dimensions must be a positive integer');
      }
    }
  }

  /**
   * Categorize the type of error for better management
   */
  private categorizeError(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'UNKNOWN_ERROR';
    }

    const message = error.message.toLowerCase();

    if (message.includes('documento') && message.includes('no encontr')) {
      return 'DOCUMENT_NOT_FOUND';
    }

    if (message.includes('chunks') && message.includes('no encontr')) {
      return 'NO_CHUNKS_FOUND';
    }

    if (message.includes('api') || message.includes('openai')) {
      return 'API_ERROR';
    }

    if (message.includes('validar') || message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }

    if (message.includes('base de datos') || message.includes('database')) {
      return 'DATABASE_ERROR';
    }

    if (
      message.includes('red') ||
      message.includes('network') ||
      message.includes('timeout')
    ) {
      return 'NETWORK_ERROR';
    }

    return 'PROCESSING_ERROR';
  }
}
