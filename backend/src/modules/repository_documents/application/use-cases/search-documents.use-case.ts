import { Injectable, Logger } from '@nestjs/common';
import { DocumentEmbeddingService } from '../../domain/services/document-embedding.service';
import type {
  VectorSearchOptions,
  SemanticSearchResult,
} from '../../domain/ports/vector-search.port';

/**
 * DTO for semantic search request
 */
export interface SearchDocumentsRequest {
  /** Search text */
  query: string;

  /** Search options */
  searchOptions?: {
    /** Maximum number of results */
    limit?: number;

    /** Minimum similarity threshold */
    similarityThreshold?: number;

    /** Filter by specific documents */
    documentIds?: string[];

    /** Filter by chunk types */
    chunkTypes?: string[];

    /** Additional configuration */
    additionalFilters?: Record<string, any>;
  };

  /** Whether to include extended metadata */
  includeMetadata?: boolean;

  /** Whether to include complete chunk content */
  includeContent?: boolean;
}

/**
 * Semantic search result
 */
export interface SearchDocumentsResponse {
  /** Indicates if the search was successful */
  success: boolean;

  /** Search result */
  result?: SemanticSearchResult;

  /** Error message if failed */
  error?: string;

  /** Error code */
  errorCode?: string;

  /** Additional information about the search */
  searchInfo?: {
    /** Processing time in ms */
    processingTimeMs: number;

    /** Processed search terms */
    processedQuery: string;

    /** Applied configuration */
    appliedOptions: VectorSearchOptions;
  };
}

/**
 * Use case for semantic document search
 *
 * Allows performing semantic similarity searches in the document
 * knowledge base using vector embeddings
 */
@Injectable()
export class SearchDocumentsUseCase {
  private readonly logger = new Logger(SearchDocumentsUseCase.name);

  constructor(
    private readonly documentEmbeddingService: DocumentEmbeddingService,
  ) {}

  /**
   * Execute a semantic search in documents
   *
   * @param request - Request with search parameters
   */
  async execute(
    request: SearchDocumentsRequest,
  ): Promise<SearchDocumentsResponse> {
    const startTime = Date.now();

    try {
      // 1. Validate input
      this.validateRequest(request);

      // 2. Prepare search options
      const searchOptions = this.prepareSearchOptions(request);

      // 3. Execute search
      const result = await this.documentEmbeddingService.searchDocuments(
        request.query,
        searchOptions,
      );

      const processingTimeMs = Date.now() - startTime;

      return {
        success: true,
        result,
        searchInfo: {
          processingTimeMs,
          processedQuery: request.query.trim(),
          appliedOptions: searchOptions,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error in SearchDocumentsUseCase:', errorMessage);

      return {
        success: false,
        error: errorMessage,
        errorCode: this.categorizeError(error),
        searchInfo: {
          processingTimeMs: Date.now() - startTime,
          processedQuery: request.query.trim(),
          appliedOptions: this.prepareSearchOptions(request),
        },
      };
    }
  }

  // ============ PRIVATE METHODS ============

  /**
   * Validate search request
   */
  private validateRequest(request: SearchDocumentsRequest): void {
    // Validate query
    if (!request.query || typeof request.query !== 'string') {
      throw new Error('Search query is required and must be a valid string');
    }

    const trimmedQuery = request.query.trim();
    if (trimmedQuery.length === 0) {
      throw new Error('Search query cannot be empty');
    }

    if (trimmedQuery.length < 3) {
      throw new Error('Search query must have at least 3 characters');
    }

    if (trimmedQuery.length > 8000) {
      throw new Error('Search query is too long (maximum 8000 characters)');
    }

    // Validate search options
    if (request.searchOptions) {
      const { limit, similarityThreshold, documentIds } = request.searchOptions;

      if (limit !== undefined) {
        if (!Number.isInteger(limit) || limit < 1) {
          throw new Error('Limit must be a positive integer');
        }

        if (limit > 1000) {
          throw new Error('Limit cannot be greater than 1000 results');
        }
      }

      if (similarityThreshold !== undefined) {
        if (
          typeof similarityThreshold !== 'number' ||
          similarityThreshold < 0 ||
          similarityThreshold > 1
        ) {
          throw new Error(
            'Similarity threshold must be a number between 0 and 1',
          );
        }
      }

      if (documentIds && Array.isArray(documentIds)) {
        if (documentIds.length === 0) {
          throw new Error(
            'If document IDs are specified, there must be at least one',
          );
        }

        const invalidIds = documentIds.filter(
          (id) => !id || typeof id !== 'string',
        );
        if (invalidIds.length > 0) {
          throw new Error('All document IDs must be valid non-empty strings');
        }
      }
    }
  }

  /**
   * Prepare vector search options
   */
  private prepareSearchOptions(
    request: SearchDocumentsRequest,
  ): VectorSearchOptions {
    const defaultOptions: VectorSearchOptions = {
      limit: 10,
      similarityThreshold: 0.7,
      includeMetadata: true,
      includeContent: true,
    };

    if (!request.searchOptions) {
      return defaultOptions;
    }

    return {
      limit: request.searchOptions.limit ?? defaultOptions.limit,
      similarityThreshold:
        request.searchOptions.similarityThreshold ??
        defaultOptions.similarityThreshold,
      includeMetadata:
        request.includeMetadata ?? defaultOptions.includeMetadata,
      includeContent: request.includeContent ?? defaultOptions.includeContent,
      documentIds: request.searchOptions.documentIds,
      chunkTypes: request.searchOptions.chunkTypes,
      additionalFilters: request.searchOptions.additionalFilters,
    };
  }

  /**
   * Categorize error type for better handling
   */
  private categorizeError(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'UNKNOWN_ERROR';
    }

    const message = error.message.toLowerCase();

    if (message.includes('query') || message.includes('search')) {
      return 'INVALID_QUERY';
    }

    if (message.includes('embedding') || message.includes('vector')) {
      return 'EMBEDDING_ERROR';
    }

    if (message.includes('search') || message.includes('find')) {
      return 'SEARCH_ERROR';
    }

    if (message.includes('api') || message.includes('openai')) {
      return 'API_ERROR';
    }

    if (message.includes('database') || message.includes('db')) {
      return 'DATABASE_ERROR';
    }

    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection')
    ) {
      return 'NETWORK_ERROR';
    }

    if (message.includes('invalid') || message.includes('validation')) {
      return 'VALIDATION_ERROR';
    }

    return 'PROCESSING_ERROR';
  }
}
