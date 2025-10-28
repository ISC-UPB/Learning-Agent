import { Logger } from '@nestjs/common';
import type { PrismaService } from '../../../../core/prisma/prisma.service';
import type {
  VectorSearchPort,
  VectorSearchOptions,
  VectorSearchResult,
  SemanticSearchResult,
  SimilarDocument,
} from '../../domain/ports/vector-search.port';
import type { EmbeddingGeneratorPort } from '../../domain/ports/embedding-generator.port';

/**
 * Configuration options for pgvector
 */
export interface PgVectorConfig {
  /** Distance function to use */
  distanceFunction: 'cosine' | 'euclidean' | 'inner_product';

  /** HNSW index configuration */
  indexConfig?: {
    /** Number of connections per node */
    m?: number;

    /** Construction buffer size */
    efConstruction?: number;

    /** Search factor */
    ef?: number;
  };
}

/**
 * Adapter for vector search using pgvector
 *
 * Implements semantic similarity searches with pgvector
 */
export class PgVectorSearchAdapter implements VectorSearchPort {
  private readonly logger = new Logger(PgVectorSearchAdapter.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingGenerator: EmbeddingGeneratorPort,
    private readonly config: PgVectorConfig = {
      distanceFunction: 'cosine',
    },
  ) {}

  /**
   * Search for similar chunks using an embedding vector
   */
  async searchByVector(
    queryVector: number[],
    options: VectorSearchOptions = {},
  ): Promise<VectorSearchResult> {
    try {
      // Validate input
      this.validateVector(queryVector);
      const finalOptions = this.normalizeOptions(options);

      // Build query based on whether there is a threshold or not
      let query: string;
      let params: any[];

      if (finalOptions.similarityThreshold) {
        query = `
          SELECT 
            dc.id,
            dc."documentId",
            dc."chunkIndex",
            dc.content,
            dc.type,
            dc."wordCount",
            dc."charCount",
            dc."startPosition",
            dc."endPosition",
            dc.metadata,
            dc."createdAt",
            d."documentTitle" as document_title,
            d."originalName" as document_file_name,
            d.size as document_file_size,
            d."contentType" as document_content_type,
            (1 - (dc.embedding <=> $1::vector)) as similarity_score
          FROM document_chunks dc
          INNER JOIN "Document" d ON dc."documentId" = d.id
          WHERE dc.embedding IS NOT NULL
          AND (1 - (dc.embedding <=> $1::vector)) >= $2
          ORDER BY dc.embedding <=> $1::vector ASC
          LIMIT $3
        `;
        params = [
          `[${queryVector.join(',')}]`,
          finalOptions.similarityThreshold,
          finalOptions.limit,
        ];
      } else {
        query = `
          SELECT 
            dc.id,
            dc."documentId",
            dc."chunkIndex",
            dc.content,
            dc.type,
            dc."wordCount",
            dc."charCount",
            dc."startPosition",
            dc."endPosition",
            dc.metadata,
            dc."createdAt",
            d."documentTitle" as document_title,
            d."originalName" as document_file_name,
            d.size as document_file_size,
            d."contentType" as document_content_type,
            (1 - (dc.embedding <=> $1::vector)) as similarity_score
          FROM document_chunks dc
          INNER JOIN "Document" d ON dc."documentId" = d.id
          WHERE dc.embedding IS NOT NULL
          ORDER BY dc.embedding <=> $1::vector ASC
          LIMIT $2
        `;
        params = [`[${queryVector.join(',')}]`, finalOptions.limit];
      }

      // run vector search query
      this.logger.debug('Executing vector search query with params:', {
        queryVectorLength: queryVector.length,
        similarityThreshold: finalOptions.similarityThreshold,
        limit: finalOptions.limit,
        hasThreshold: !!finalOptions.similarityThreshold,
      });

      const results = await this.prisma.$queryRawUnsafe(query, ...params);

      this.logger.debug(
        `Vector search results obtained: ${(results as any[]).length}`,
      );
      if ((results as any[]).length > 0) {
        this.logger.debug('First search result:', {
          documentId: (results as any[])[0].documentId,
          similarity: (results as any[])[0].similarity_score,
          chunkId: (results as any[])[0].id,
        });
      }

      // Map results to expected interface
      const mappedResults = (results as any[]).map((row) => ({
        id: row.id,
        documentId: row.documentId,
        content: row.content,
        type: row.type,
        chunkIndex: row.chunkIndex,
        wordCount: row.wordCount,
        charCount: row.charCount,
        startPosition: row.startPosition,
        endPosition: row.endPosition,
        similarityScore: parseFloat(row.similarity_score),
        documentTitle: row.document_title,
        documentFileName: row.document_file_name,
        documentFileSize: row.document_file_size,
        documentContentType: row.document_content_type,
        metadata: row.metadata,
        createdAt: row.createdAt,
      }));

      return {
        chunks: mappedResults,
        totalResults: mappedResults.length,
        searchOptions: finalOptions,
        processingTimeMs: 0, // Calculate real time
      };
    } catch (error) {
      this.logger.error('Error in vector search:', error);
      throw this.handleSearchError(error, 'searchByVector');
    }
  }

  /**
   * Search for similar chunks by converting text to vector first
   */
  async searchByText(
    query: string,
    options: VectorSearchOptions = {},
  ): Promise<SemanticSearchResult> {
    try {
      // Validate input
      if (!query || typeof query !== 'string') {
        throw new Error('Search query must be a valid string');
      }

      const trimmedQuery = query.trim();
      if (trimmedQuery.length === 0) {
        throw new Error('Search query cannot be empty');
      }

      // 1. Generate embedding from query text
      const embeddingResult =
        await this.embeddingGenerator.generateEmbedding(trimmedQuery);

      // 2. Search using the vector
      const vectorResult = await this.searchByVector(
        embeddingResult.embedding,
        options,
      );

      return {
        query: trimmedQuery,
        queryEmbedding: embeddingResult,
        searchResult: vectorResult,
        totalResults: vectorResult.totalResults,
        processingTimeMs: vectorResult.processingTimeMs,
      };
    } catch (error) {
      this.logger.error('Error in text search:', error);
      throw this.handleSearchError(error, 'searchByText');
    }
  }

  /**
   * Find chunks similar to a specific one
   */
  async findSimilarChunks(
    chunkId: string,
    options: VectorSearchOptions = {},
  ): Promise<VectorSearchResult> {
    try {
      // 1. Get the reference chunk
      const referenceChunk = await this.getChunkEmbedding(chunkId);
      if (!referenceChunk) {
        throw new Error(`Chunk not found with ID: ${chunkId}`);
      }

      // 2. Search for similar chunks excluding the same one
      const finalOptions = {
        ...options,
        excludeChunkIds: [...(options.excludeChunkIds || []), chunkId],
      };

      return this.searchByVector(referenceChunk.embedding, finalOptions);
    } catch (error) {
      this.logger.error('Error finding similar chunks:', error);
      throw this.handleSearchError(error, 'findSimilarChunks');
    }
  }

  /**
   * Find documents similar to a specific one
   */
  async findSimilarDocuments(
    documentId: string,
    options: VectorSearchOptions = {},
  ): Promise<SimilarDocument[]> {
    try {
      // 1. Get average embeddings of the document
      const documentEmbedding =
        await this.getDocumentAverageEmbedding(documentId);
      if (!documentEmbedding) {
        throw new Error(`No embeddings found for document: ${documentId}`);
      }

      // 2. Search for similar documents
      const finalOptions = {
        ...options,
        excludeDocumentIds: [...(options.excludeDocumentIds || []), documentId],
        groupByDocument: true,
      };

      const searchResult = await this.searchByVector(
        documentEmbedding,
        finalOptions,
      );

      // 3. group by document and calculate average similarity
      const documentMap = new Map<
        string,
        {
          chunks: typeof searchResult.chunks;
          totalSimilarity: number;
          maxSimilarity: number;
        }
      >();

      searchResult.chunks.forEach((chunk) => {
        const docId = chunk.documentId;
        if (!documentMap.has(docId)) {
          documentMap.set(docId, {
            chunks: [],
            totalSimilarity: 0,
            maxSimilarity: 0,
          });
        }

        const docData = documentMap.get(docId)!;
        docData.chunks.push(chunk);
        docData.totalSimilarity += chunk.similarityScore;
        docData.maxSimilarity = Math.max(
          docData.maxSimilarity,
          chunk.similarityScore,
        );
      });

      // 4. Convert to SimilarDocument[]
      const similarDocuments: SimilarDocument[] = [];
      for (const [docId, data] of documentMap) {
        const firstChunk = data.chunks[0];
        similarDocuments.push({
          documentId: docId,
          title: firstChunk.documentTitle,
          fileName: firstChunk.documentFileName,
          averageSimilarity: data.totalSimilarity / data.chunks.length,
          maxSimilarity: data.maxSimilarity,
          relevantChunks: data.chunks.slice(0, 3), // 3 most relevant chunks
          totalChunks: data.chunks.length,
        });
      }

      // 5. Sort by average similarity
      similarDocuments.sort(
        (a, b) => b.averageSimilarity - a.averageSimilarity,
      );

      return similarDocuments.slice(0, options.limit || 10);
    } catch (error) {
      this.logger.error('Error finding similar documents:', error);
      throw this.handleSearchError(error, 'findSimilarDocuments');
    }
  }

  // ============ Private methods ============

  /**
   * Validate that the vector is valid
   */
  private validateVector(vector: number[]): void {
    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error('Vector must be a non-empty array of numbers');
    }

    if (vector.some((val) => typeof val !== 'number' || !isFinite(val))) {
      throw new Error('All vector elements must be finite numbers');
    }

    // Verify typical dimensions
    if (![256, 512, 1024, 1536, 3072].includes(vector.length)) {
      this.logger.warn(`Unusual vector dimensions: ${vector.length}`);
    }
  }

  /**
   * Normalize search options
   */
  private normalizeOptions(
    options: VectorSearchOptions,
  ): Required<VectorSearchOptions> {
    return {
      limit: options.limit || 10,
      similarityThreshold: options.similarityThreshold || 0.7,
      includeMetadata: options.includeMetadata ?? true,
      includeContent: options.includeContent ?? true,
      documentIds: options.documentIds || [],
      chunkTypes: options.chunkTypes || [],
      excludeChunkIds: options.excludeChunkIds || [],
      excludeDocumentIds: options.excludeDocumentIds || [],
      groupByDocument: options.groupByDocument ?? false,
      additionalFilters: options.additionalFilters || {},
    };
  }

  /**
   * Get the distance operator based on configuration
   */
  private getDistanceOperator(): string {
    switch (this.config.distanceFunction) {
      case 'cosine':
        return '<->';
      case 'euclidean':
        return '<->';
      case 'inner_product':
        return '<#>';
      default:
        return '<->';
    }
  }

  /**
   * Get the order direction based on configuration
   */
  private getOrderDirection(): string {
    return this.config.distanceFunction === 'inner_product' ? 'DESC' : 'ASC';
  }

  /**
   * Get the threshold operator based on configuration
   */
  private getThresholdOperator(): string {
    return this.config.distanceFunction === 'inner_product' ? '>=' : '<=';
  }

  /**
   * Build WHERE conditions for filters
   */
  private buildWhereConditions(
    options: Required<VectorSearchOptions>,
  ): string[] {
    const conditions: string[] = [];

    if (options.documentIds && options.documentIds.length > 0) {
      conditions.push(`dc.document_id = ANY($${conditions.length + 2})`);
    }

    if (options.chunkTypes && options.chunkTypes.length > 0) {
      conditions.push(`dc.type = ANY($${conditions.length + 2})`);
    }

    if (options.excludeChunkIds && options.excludeChunkIds.length > 0) {
      conditions.push(`dc.id NOT IN ($${conditions.length + 2})`);
    }

    if (options.excludeDocumentIds && options.excludeDocumentIds.length > 0) {
      conditions.push(`dc.document_id NOT IN ($${conditions.length + 2})`);
    }

    // Ensure it has embedding
    conditions.push('dc.embedding IS NOT NULL');

    return conditions;
  }

  /**
   * Get the embedding of a specific chunk
   */
  private async getChunkEmbedding(
    chunkId: string,
  ): Promise<{ embedding: number[] } | null> {
    // Currently simulated - in real implementation:
    // const result = await this.prisma.documentChunk.findUnique({
    //   where: { id: chunkId },
    //   select: { embedding: true }
    // });
    // return result?.embedding ? { embedding: JSON.parse(result.embedding) } : null;

    this.logger.debug('Getting embedding for chunk:', chunkId);
    return null; // Simulate for now
  }

  /**
   * Calculate the average embedding of a document
   */
  private async getDocumentAverageEmbedding(
    documentId: string,
  ): Promise<number[] | null> {
    // Real implementation pending
    this.logger.debug(
      'Calculating average embedding for document:',
      documentId,
    );
    return null; // Simulate for now
  }

  /**
   * Simulate vector search results for development
   */
  private async simulateVectorSearch(
    queryVector: number[],
    options: Required<VectorSearchOptions>,
  ): Promise<any[]> {
    // Simulation for development - replace with real query
    return [];
  }

  /**
   * Handle search errors
   */
  private handleSearchError(error: unknown, operation: string): Error {
    if (error instanceof Error) {
      return new Error(`Error in ${operation}: ${error.message}`);
    }
    return new Error(`Unknown error in ${operation}`);
  }
}
