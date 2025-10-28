import { Injectable, Logger } from '@nestjs/common';
import type { DocumentChunk } from '../entities/document-chunk.entity';
import type {
  EmbeddingGeneratorPort,
  EmbeddingConfig,
  BatchEmbeddingResult,
} from '../ports/embedding-generator.port';
import type {
  VectorSearchPort,
  SemanticSearchResult,
  VectorSearchOptions,
} from '../ports/vector-search.port';
import type { DocumentChunkRepositoryPort } from '../ports/document-chunk-repository.port';
export interface DocumentEmbeddingOptions {
  /** Embedding configuration */
  embeddingConfig?: Partial<EmbeddingConfig>;

  /** Whether to replace existing embeddings */
  replaceExisting?: boolean;

  /** Process in batches of this size */
  batchSize?: number;

  /** Filters for specific chunks */
  chunkFilters?: {
    /** Chunk types to process */
    chunkTypes?: string[];

    /** Specific chunk indices */
    chunkIndices?: number[];

    /** Minimum content size */
    minContentLength?: number;
  };
}

export interface DocumentEmbeddingResult {
  documentId: string;

  batchResults: BatchEmbeddingResult[];

  /** Total chunks processed */
  totalChunksProcessed: number;

  /** Chunks that already had embeddings */
  chunksSkipped: number;

  /** Chunks with errors */
  chunksWithErrors: number;

  totalProcessingTimeMs: number;

  /** Estimated cost (if available) */
  estimatedCost?: {
    totalTokens: number;
    costPerToken?: number;
    totalCost?: number;
  };

  errors?: string[];
}

@Injectable()
export class DocumentEmbeddingService {
  private readonly logger = new Logger(DocumentEmbeddingService.name);

  constructor(
    private readonly embeddingGenerator: EmbeddingGeneratorPort,
    private readonly vectorSearch: VectorSearchPort,
    private readonly chunkRepository: DocumentChunkRepositoryPort,
  ) {}

  async generateDocumentEmbeddings(
    documentId: string,
    options: DocumentEmbeddingOptions = {},
  ): Promise<DocumentEmbeddingResult> {
    const startTime = Date.now();

    try {
      const chunksResult =
        await this.chunkRepository.findByDocumentId(documentId);
      let chunks = chunksResult.chunks;

      if (chunks.length === 0) {
        throw new Error(`No chunks found for document ${documentId}`);
      }

      chunks = this.applyChunkFilters(chunks, options.chunkFilters);

      if (!options.replaceExisting) {
        chunks = await this.filterChunksWithoutEmbeddings(chunks);
      }

      const validChunks = chunks.filter((chunk) =>
        this.embeddingGenerator.validateText(chunk.content),
      );

      if (validChunks.length === 0) {
        throw new Error('No valid chunks to process embeddings');
      }

      const batchSize = options.batchSize || 20;
      const batchResults: BatchEmbeddingResult[] = [];
      let totalChunksProcessed = 0;
      let chunksWithErrors = 0;
      const errors: string[] = [];

      for (let i = 0; i < validChunks.length; i += batchSize) {
        const batch = validChunks.slice(i, i + batchSize);
        const texts = batch.map((chunk) => chunk.content);

        try {
          const batchResult =
            await this.embeddingGenerator.generateBatchEmbeddings(
              texts,
              options.embeddingConfig,
            );

          await this.storeEmbeddings(batch, batchResult);

          batchResults.push(batchResult);
          totalChunksProcessed += batchResult.totalEmbeddings;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(
            `Error processing batch ${i / batchSize + 1}: ${errorMessage}`,
          );
          chunksWithErrors += batch.length;
        }
      }

      const totalProcessingTimeMs = Date.now() - startTime;

      const totalTokens = batchResults.reduce(
        (sum, result) => sum + result.totalTokensUsed,
        0,
      );
      const chunksSkipped = chunksResult.chunks.length - validChunks.length;

      return {
        documentId,
        batchResults,
        totalChunksProcessed,
        chunksSkipped,
        chunksWithErrors,
        totalProcessingTimeMs,
        estimatedCost: {
          totalTokens,
          costPerToken: 0.00002,
          totalCost: totalTokens * 0.00002,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Error generating embeddings for document ${documentId}: ${errorMessage}`,
      );
    }
  }

  async searchDocuments(
    query: string,
    options?: VectorSearchOptions,
  ): Promise<SemanticSearchResult> {
    return this.vectorSearch.searchByText(query, options);
  }

  async findSimilarChunks(chunkId: string, options?: VectorSearchOptions) {
    return this.vectorSearch.findSimilarChunks(chunkId, options);
  }

  findSimilarDocuments(documentId: string, options?: VectorSearchOptions) {
    return this.vectorSearch.findSimilarDocuments(documentId, options);
  }

  async hasEmbeddings(documentId: string): Promise<boolean> {
    const chunks = await this.chunkRepository.findByDocumentId(documentId);
    return chunks.chunks.length > 0;
  }

  private applyChunkFilters(
    chunks: DocumentChunk[],
    filters?: DocumentEmbeddingOptions['chunkFilters'],
  ): DocumentChunk[] {
    if (!filters) return chunks;

    let filtered = chunks;

    if (filters.chunkTypes) {
      filtered = filtered.filter((chunk) =>
        filters.chunkTypes!.includes(chunk.type),
      );
    }

    if (filters.chunkIndices) {
      filtered = filtered.filter((chunk) =>
        filters.chunkIndices!.includes(chunk.chunkIndex),
      );
    }

    if (filters.minContentLength) {
      filtered = filtered.filter(
        (chunk) => chunk.content.length >= filters.minContentLength!,
      );
    }

    return filtered;
  }

  private async filterChunksWithoutEmbeddings(
    chunks: DocumentChunk[],
  ): Promise<DocumentChunk[]> {
    const chunksWithoutEmbeddings: DocumentChunk[] = [];

    for (const chunk of chunks) {
      const hasEmbedding = await this.chunkRepository.hasEmbedding(chunk.id);
      if (!hasEmbedding) {
        chunksWithoutEmbeddings.push(chunk);
      }
    }

    return chunksWithoutEmbeddings;
  }

  private async storeEmbeddings(
    chunks: DocumentChunk[],
    batchResult: BatchEmbeddingResult,
  ): Promise<void> {
    try {
      const updates = chunks.map((chunk, index) => ({
        chunkId: chunk.id,
        embedding: batchResult.embeddings[index],
      }));

      await this.chunkRepository.updateBatchEmbeddings(updates);
    } catch (error) {
      this.logger.error('Error storing embeddings:', error);
      throw new Error(`Error storing embeddings: ${error}`);
    }
  }
}
