import {
  Controller,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ContextualLoggerService } from '../services/contextual-logger.service';
import { GenerateDocumentEmbeddingsUseCase } from '../../application/use-cases/generate-document-embeddings.use-case';
import { SearchDocumentsUseCase } from '../../application/use-cases/search-documents.use-case';

/**
 * DTO for generating document embeddings
 */
export class GenerateEmbeddingsDto {
  /** Embedding configuration */
  embeddingConfig?: {
    model?: string;
    dimensions?: number;
    additionalConfig?: Record<string, any>;
  };

  /** Whether to replace existing embeddings */
  replaceExisting?: boolean = false;

  /** Batch size for processing */
  batchSize?: number = 20;

  /** Filters for specific chunks */
  chunkFilters?: {
    chunkTypes?: string[];
    chunkIndices?: number[];
    minContentLength?: number;
  };
}

/**
 * DTO for semantic search
 */
export class SemanticSearchDto {
  /** Search text */
  @IsString({ message: 'Query must be a text string' })
  @IsNotEmpty({ message: 'Search query is required' })
  query: string;

  /** Search options */
  @IsOptional()
  searchOptions?: {
    limit?: number;
    similarityThreshold?: number;
    documentIds?: string[];
    chunkTypes?: string[];
    additionalFilters?: Record<string, any>;
  };

  /** Whether to include extended metadata */
  @IsOptional()
  @IsBoolean({ message: 'includeMetadata must be a boolean' })
  includeMetadata?: boolean = true;

  /** Whether to include complete chunk content */
  @IsOptional()
  @IsBoolean({ message: 'includeContent must be a boolean' })
  includeContent?: boolean = true;
}

/**
 * Controller for embeddings and semantic search functionalities
 *
 * Handles vector embedding generation operations
 * and semantic similarity search
 */
@ApiTags('Repository Documents - Embeddings')
@Controller('api/repository-documents/embeddings')
export class EmbeddingsController {
  private readonly logger = new Logger(EmbeddingsController.name);

  constructor(
    private readonly generateEmbeddingsUseCase: GenerateDocumentEmbeddingsUseCase,
    private readonly searchDocumentsUseCase: SearchDocumentsUseCase,
    private readonly contextualLogger: ContextualLoggerService,
  ) {}

  /**
   * Generate embeddings for all chunks of a document
   */
  @Post('generate/:documentId')
  @ApiOperation({
    summary: 'Generate embeddings for a document',
    description:
      'Process all chunks of a document and generate vector embeddings using OpenAI',
  })
  @ApiParam({
    name: 'documentId',
    description: 'Unique ID of the document to process',
    example: 'doc_123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: GenerateEmbeddingsDto,
    description: 'Configuration for embedding generation',
    examples: {
      basic: {
        summary: 'Basic configuration',
        value: {
          replaceExisting: false,
          batchSize: 20,
        },
      },
      advanced: {
        summary: 'Advanced configuration',
        value: {
          embeddingConfig: {
            model: 'text-embedding-3-small',
            dimensions: 1536,
          },
          replaceExisting: true,
          batchSize: 50,
          chunkFilters: {
            chunkTypes: ['paragraph', 'heading'],
            minContentLength: 100,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Embeddings generated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        result: {
          type: 'object',
          properties: {
            documentId: { type: 'string' },
            totalChunksProcessed: { type: 'number' },
            chunksSkipped: { type: 'number' },
            chunksWithErrors: { type: 'number' },
            totalProcessingTimeMs: { type: 'number' },
            estimatedCost: {
              type: 'object',
              properties: {
                totalTokens: { type: 'number' },
                totalCost: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
  })
  async generateEmbeddings(
    @Param('documentId') documentId: string,
    @Body() dto: GenerateEmbeddingsDto,
  ) {
    try {
      this.logger.log(
        `Starting embeddings generation for document: ${documentId}`,
      );
      const startTime = Date.now();

      // Run use case
      const result = await this.generateEmbeddingsUseCase.execute({
        documentId,
        ...dto,
      });

      const processingTime = Date.now() - startTime;

      if (!result.success) {
        this.logger.error(`Error generating embeddings: ${result.error}`);
        throw new HttpException(
          {
            message: result.error,
            errorCode: result.errorCode,
            documentId,
          },
          this.getHttpStatusFromErrorCode(result.errorCode),
        );
      }

      this.logger.log(
        `Embeddings generated successfully for ${documentId} in ${processingTime}ms`,
      );

      return {
        success: true,
        result: result.result,
        metadata: {
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Error in embeddings controller:`, error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          message: 'Internal error while generating embeddings',
          error: error instanceof Error ? error.message : 'Unknown error',
          documentId,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Perform a semantic search on the documents
   */
  @Post('search')
  @ApiOperation({
    summary: 'Semantic search of documents',
    description:
      'Searches for documents and chunks by semantic similarity using vector embeddings',
  })
  @ApiBody({
    type: SemanticSearchDto,
    description: 'Semantic search parameters',
    examples: {
      basic: {
        summary: 'Basic search',
        value: {
          query: 'What is artificial intelligence?',
        },
      },
      advanced: {
        summary: 'Advanced search',
        value: {
          query: 'machine learning algorithms',
          searchOptions: {
            limit: 15,
            similarityThreshold: 0.6,
            chunkTypes: ['paragraph'],
          },
          includeMetadata: true,
          includeContent: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Search completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        result: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            totalResults: { type: 'number' },
            chunks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  content: { type: 'string' },
                  similarityScore: { type: 'number' },
                  documentTitle: { type: 'string' },
                },
              },
            },
          },
        },
        searchInfo: {
          type: 'object',
          properties: {
            processingTimeMs: { type: 'number' },
            processedQuery: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid search parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async searchDocuments(@Body() dto: SemanticSearchDto) {
    try {
      // Additional input validation
      if (!dto || !dto.query || typeof dto.query !== 'string') {
        throw new HttpException(
          {
            message: 'The search query is required and must be a valid string',
            errorCode: 'INVALID_REQUEST',
            receivedData: {
              dto: !!dto,
              query: dto?.query,
              queryType: typeof dto?.query,
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Starting semantic search: "${dto.query}"`);
      const startTime = Date.now();

      // Execute use case
      const result = await this.searchDocumentsUseCase.execute(dto);

      const processingTime = Date.now() - startTime;

      if (!result.success) {
        this.logger.error(`Error in semantic search: ${result.error}`);
        throw new HttpException(
          {
            message: result.error,
            errorCode: result.errorCode,
            query: dto.query,
          },
          this.getHttpStatusFromErrorCode(result.errorCode),
        );
      }

      this.logger.log(
        `Search completed: ${result.result?.totalResults || 0} results in ${processingTime}ms`,
      );

      return {
        success: true,
        result: result.result,
        searchInfo: {
          ...result.searchInfo,
          totalProcessingTimeMs: processingTime,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Error in search controller:`, error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          message: 'Internal error in semantic search',
          error: error instanceof Error ? error.message : 'Unknown error',
          query: dto.query,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Converts error codes to appropriate HTTP statuses
   */
  private getHttpStatusFromErrorCode(errorCode?: string): HttpStatus {
    switch (errorCode) {
      case 'DOCUMENT_NOT_FOUND':
      case 'NO_CHUNKS_FOUND':
        return HttpStatus.NOT_FOUND;

      case 'VALIDATION_ERROR':
      case 'INVALID_QUERY':
        return HttpStatus.BAD_REQUEST;

      case 'API_ERROR':
      case 'NETWORK_ERROR':
        return HttpStatus.BAD_GATEWAY;

      case 'DATABASE_ERROR':
        return HttpStatus.INTERNAL_SERVER_ERROR;

      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
