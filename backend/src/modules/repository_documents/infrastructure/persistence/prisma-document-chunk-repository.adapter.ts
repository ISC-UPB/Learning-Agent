import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { DocumentChunk } from '../../domain/entities/document-chunk.entity';
import { DocumentChunkService } from '../../domain/services/document-chunk.service';
import type {
  DocumentChunkRepositoryPort,
  FindChunksResult,
  FindChunksOptions,
} from '../../domain/ports/document-chunk-repository.port';

/**
 * Repository adapter for DocumentChunk using Prisma
 */
@Injectable()
export class PrismaDocumentChunkRepositoryAdapter
  implements DocumentChunkRepositoryPort
{
  private readonly logger = new Logger(
    PrismaDocumentChunkRepositoryAdapter.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Save a chunk to the database
   */
  async save(chunk: DocumentChunk): Promise<DocumentChunk> {
    try {
      const savedChunk = await this.prisma.documentChunk.create({
        data: {
          id: chunk.id,
          documentId: chunk.documentId,
          content: chunk.content,
          contentHash: chunk.contentHash,
          chunkIndex: chunk.chunkIndex,
          startPosition: 0, // Default value
          endPosition: chunk.content.length, // Default value
          type: chunk.type,
          wordCount: this.countWords(chunk.content),
          charCount: chunk.content.length,
          metadata: chunk.metadata,
          createdAt: chunk.createdAt,
        },
      });

      return this.mapToEntity(savedChunk);
    } catch (error) {
      this.logger.error(`Error saving chunk ${chunk.id}:`, error);
      throw new Error(`Error saving chunk: ${error}`);
    }
  }

  /**
   * Save multiple chunks in a transaction (more efficient)
   */
  async saveMany(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    if (chunks.length === 0) {
      return [];
    }

    try {
      this.logger.log(`Saving ${chunks.length} chunks in transaction...`);

      const savedChunks = await this.prisma.$transaction(
        chunks.map((chunk) =>
          this.prisma.documentChunk.create({
            data: {
              id: chunk.id,
              documentId: chunk.documentId,
              content: chunk.content,
              contentHash: chunk.contentHash,
              chunkIndex: chunk.chunkIndex,
              startPosition: 0,
              endPosition: chunk.content.length,
              type: chunk.type,
              wordCount: this.countWords(chunk.content),
              charCount: chunk.content.length,
              metadata: chunk.metadata,
              createdAt: chunk.createdAt,
            },
          }),
        ),
      );

      this.logger.log(`${savedChunks.length} chunks saved successfully`);

      return savedChunks.map((chunk) => this.mapToEntity(chunk));
    } catch (error) {
      this.logger.error(`Error saving ${chunks.length} chunks:`, error);
      throw new Error(`Error saving chunks in batch: ${error}`);
    }
  }

  /**
   * Find a chunk by its ID
   */
  async findById(id: string): Promise<DocumentChunk | null> {
    try {
      const chunk = await this.prisma.documentChunk.findUnique({
        where: { id },
      });

      return chunk ? this.mapToEntity(chunk) : null;
    } catch (error) {
      this.logger.error(`Error finding chunk ${id}:`, error);
      throw new Error(`Error finding chunk: ${error}`);
    }
  }

  /**
   * Find all chunks belonging to a specific document.
   */
  async findByDocumentId(
    documentId: string,
    options: FindChunksOptions = {},
  ): Promise<FindChunksResult> {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'chunkIndex',
        orderDirection = 'asc',
      } = options;

      const [chunks, total] = await Promise.all([
        this.prisma.documentChunk.findMany({
          where: { documentId, isActive: true },
          orderBy: { [orderBy]: orderDirection },
          take: limit,
          skip: offset,
        }),
        this.prisma.documentChunk.count({
          where: { documentId, isActive: true },
        }),
      ]);

      return {
        chunks: chunks.map((chunk) => this.mapToEntity(chunk)),
        total,
      };
    } catch (error) {
      this.logger.error(
        `Error finding chunks of document ${documentId}:`,
        error,
      );
      throw new Error(`Error finding chunks of document: ${error}`);
    }
  }

  /**
   * Find chunks by type.
   */
  async findByType(
    type: string,
    options: FindChunksOptions = {},
  ): Promise<FindChunksResult> {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'createdAt',
        orderDirection = 'desc',
      } = options;

      const [chunks, total] = await Promise.all([
        this.prisma.documentChunk.findMany({
          where: { type: type, isActive: true },
          orderBy: { [orderBy]: orderDirection },
          take: limit,
          skip: offset,
        }),
        this.prisma.documentChunk.count({
          where: { type: type, isActive: true },
        }),
      ]);

      return {
        chunks: chunks.map((chunk) => this.mapToEntity(chunk)),
        total,
      };
    } catch (error) {
      this.logger.error(`Error finding chunks of type ${type}:`, error);
      throw new Error(`Error finding chunks of type: ${error}`);
    }
  }

  /**
   * Delete all chunks of a document
   */
  async deleteByDocumentId(documentId: string): Promise<void> {
    try {
      const result = await this.prisma.documentChunk.deleteMany({
        where: { documentId },
      });

      this.logger.log(
        `Deleted ${result.count} chunks of document ${documentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error deleting chunks of document ${documentId}:`,
        error,
      );
      throw new Error(`Error deleting chunks of document: ${error}`);
    }
  }

  /**
   * Mark all chunks of a document as deleted (soft delete)
   */
  async softDeleteByDocumentId(documentId: string): Promise<void> {
    try {
      const result = await this.prisma.documentChunk.updateMany({
        where: {
          documentId,
          isActive: true,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      this.logger.log(
        `Marked as deleted ${result.count} chunks of document ${documentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error marking chunks as deleted of document ${documentId}:`,
        error,
      );
      throw new Error(`Error marking chunks as deleted of document: ${error}`);
    }
  }

  /**
   * Restore all deleted chunks of a document
   */
  async restoreByDocumentId(documentId: string): Promise<void> {
    try {
      const result = await this.prisma.documentChunk.updateMany({
        where: {
          documentId,
          isActive: false,
        },
        data: {
          isActive: true,
          updatedAt: new Date(),
        },
      });

      this.logger.log(
        `Restored ${result.count} chunks of document ${documentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error restoring chunks of document ${documentId}:`,
        error,
      );
      throw new Error(`Error restoring chunks: ${error}`);
    }
  }

  /**
   * Delete a specific chunk
   */
  async deleteById(id: string): Promise<void> {
    try {
      await this.prisma.documentChunk.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Error deleting chunk ${id}:`, error);
      throw new Error(`Error deleting chunk: ${error}`);
    }
  }

  /**
   * Count the total number of chunks of a document
   */
  async countByDocumentId(documentId: string): Promise<number> {
    try {
      return await this.prisma.documentChunk.count({
        where: { documentId, isActive: true },
      });
    } catch (error) {
      this.logger.error(
        `Error counting chunks of document ${documentId}:`,
        error,
      );
      throw new Error(`Error counting chunks: ${error}`);
    }
  }

  /**
   * Check if there are chunks for a document
   */
  async existsByDocumentId(documentId: string): Promise<boolean> {
    try {
      const count = await this.prisma.documentChunk.count({
        where: { documentId, isActive: true },
        take: 1,
      });

      return count > 0;
    } catch (error) {
      this.logger.error(
        `Error checking chunks of document ${documentId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Get statistics of chunks for a document
   */
  async getDocumentChunkStatistics(documentId: string): Promise<{
    totalChunks: number;
    averageChunkSize: number;
    minChunkSize: number;
    maxChunkSize: number;
    totalContentLength: number;
  }> {
    try {
      const contentStats = await this.prisma.$queryRaw<
        Array<{
          total_chunks: number;
          min_length: number;
          max_length: number;
          avg_length: number;
          total_length: number;
        }>
      >`
        SELECT 
          COUNT(*) as total_chunks,
          MIN(LENGTH(content)) as min_length,
          MAX(LENGTH(content)) as max_length,
          AVG(LENGTH(content))::int as avg_length,
          SUM(LENGTH(content)) as total_length
        FROM "document_chunks" 
        WHERE "documentId" = ${documentId}
      `;

      const stats = contentStats[0];

      return {
        totalChunks: Number(stats?.total_chunks) || 0,
        averageChunkSize: stats?.avg_length || 0,
        minChunkSize: stats?.min_length || 0,
        maxChunkSize: stats?.max_length || 0,
        totalContentLength: Number(stats?.total_length) || 0,
      };
    } catch (error) {
      this.logger.error(
        `Error getting statistics of document ${documentId}:`,
        error,
      );

      const count = await this.countByDocumentId(documentId);
      return {
        totalChunks: count,
        averageChunkSize: 0,
        minChunkSize: 0,
        maxChunkSize: 0,
        totalContentLength: 0,
      };
    }
  }

  // ============ METHODS FOR EMBEDDINGS ============

  /**
   * Update the embedding of a specific chunk
   */
  async updateChunkEmbedding(
    chunkId: string,
    embedding: number[],
  ): Promise<void> {
    try {
      // Use $queryRaw to handle the vector data type.
      await this.prisma.$queryRaw`
        UPDATE "document_chunks" 
        SET embedding = ${JSON.stringify(embedding)}::vector, 
            "updatedAt" = NOW()
        WHERE id = ${chunkId}
      `;
    } catch (error) {
      this.logger.error(`Error updating embedding of chunk ${chunkId}:`, error);
      throw new Error(`Error updating embedding: ${error}`);
    }
  }

  /**
   * Update embeddings of multiple chunks in batch (more efficient)
   */
  async updateBatchEmbeddings(
    updates: Array<{ chunkId: string; embedding: number[] }>,
  ): Promise<void> {
    if (updates.length === 0) {
      return;
    }

    try {
      this.logger.log(`Updating ${updates.length} embeddings in batch...`);

      // Use transaction with $queryRaw to handle the vector data type
      await this.prisma.$transaction(
        updates.map(
          ({ chunkId, embedding }) =>
            this.prisma.$queryRaw`
            UPDATE "document_chunks" 
            SET embedding = ${JSON.stringify(embedding)}::vector,
                "updatedAt" = NOW()
            WHERE id = ${chunkId}
          `,
        ),
      );

      this.logger.log(`${updates.length} embeddings updated successfully`);
    } catch (error) {
      this.logger.error(`Error updating ${updates.length} embeddings:`, error);
      throw new Error(`Error updating embeddings in batch: ${error}`);
    }
  }

  /**
   * Check if a chunk has an embedding generated
   */
  async hasEmbedding(chunkId: string): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRaw<
        Array<{ has_embedding: boolean }>
      >`
        SELECT (embedding IS NOT NULL) as has_embedding
        FROM "document_chunks"
        WHERE id = ${chunkId}
      `;

      return result[0]?.has_embedding || false;
    } catch (error) {
      this.logger.error(`Error checking embedding of chunk ${chunkId}:`, error);
      return false;
    }
  }

  /**
   * Find chunks that do not have embeddings generated for a document
   */
  async findChunksWithoutEmbeddings(
    documentId: string,
    options: FindChunksOptions = {},
  ): Promise<FindChunksResult> {
    try {
      const { limit = 50, offset = 0 } = options;

      // Use a direct SQL query to avoid problems with the vector data type.
      const chunks = await this.prisma.$queryRaw<
        Array<{
          id: string;
          documentId: string;
          content: string;
          chunkIndex: number;
          type: string;
          metadata: any;
          createdAt: Date;
          updatedAt: Date;
        }>
      >`
        SELECT id, "documentId", content, "chunkIndex", type, metadata, "createdAt", "updatedAt"
        FROM "document_chunks"
        WHERE "documentId" = ${documentId} AND embedding IS NULL
        ORDER BY "chunkIndex" ASC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const totalResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM "document_chunks"
        WHERE "documentId" = ${documentId} AND embedding IS NULL
      `;

      const total = Number(totalResult[0]?.count || 0);

      return {
        chunks: chunks.map((chunk) => this.mapToEntity(chunk)),
        total,
      };
    } catch (error) {
      this.logger.error(`Error finding chunks without embeddings:`, error);
      throw new Error(`Error finding chunks without embeddings: ${error}`);
    }
  }

  // ============ PRIVATE METHODS ============

  // ============ DEDUPLICATION METHODS ============

  /**
   * Find a chunk by its content hash to detect duplicates
   */
  async findByContentHash(
    documentId: string,
    contentHash: string,
  ): Promise<DocumentChunk | null> {
    try {
      const chunk = await this.prisma.documentChunk.findFirst({
        where: {
          documentId,
          contentHash,
          isActive: true,
        },
      });

      return chunk ? this.mapToEntity(chunk) : null;
    } catch (error) {
      this.logger.error(
        `Error finding chunk by hash for document ${documentId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Find multiple chunks by their content hashes (batch operation)
   */
  async findByContentHashes(
    documentId: string,
    contentHashes: string[],
  ): Promise<DocumentChunk[]> {
    if (contentHashes.length === 0) {
      return [];
    }

    try {
      const chunks = await this.prisma.documentChunk.findMany({
        where: {
          documentId,
          contentHash: { in: contentHashes },
          isActive: true,
        },
      });

      return chunks.map((chunk) => this.mapToEntity(chunk));
    } catch (error) {
      this.logger.error(
        `Error finding chunks by hashes for document ${documentId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Save chunks with deduplication - skips chunks with existing hashes
   */
  async saveManyWithDeduplication(chunks: DocumentChunk[]): Promise<{
    saved: DocumentChunk[];
    skipped: number;
    duplicateHashes: string[];
  }> {
    if (chunks.length === 0) {
      return { saved: [], skipped: 0, duplicateHashes: [] };
    }

    try {
      const documentId = chunks[0].documentId;
      const contentHashes = chunks.map((c) => c.contentHash);

      this.logger.log(
        `Checking for duplicate chunks in document ${documentId}...`,
      );

      // Find existing chunks by hash
      const existingChunks = await this.findByContentHashes(
        documentId,
        contentHashes,
      );
      const existingHashes = new Set(
        existingChunks.map((c) => c.contentHash),
      );

      // Filter out duplicates
      const chunksToSave = chunks.filter(
        (chunk) => !existingHashes.has(chunk.contentHash),
      );
      const duplicateHashes = Array.from(existingHashes);

      this.logger.log(
        `Found ${existingChunks.length} duplicate chunks. Saving ${chunksToSave.length} new chunks.`,
      );

      // Save only new chunks
      const savedChunks =
        chunksToSave.length > 0 ? await this.saveMany(chunksToSave) : [];

      return {
        saved: savedChunks,
        skipped: existingChunks.length,
        duplicateHashes,
      };
    } catch (error) {
      this.logger.error(
        `Error saving chunks with deduplication:`,
        error,
      );
      throw new Error(`Error saving chunks with deduplication: ${error}`);
    }
  }

  // ============ PRIVATE METHODS ============

  /**
   * Maps the result of Prisma to the domain entity
   */
  private mapToEntity(prismaChunk: any): DocumentChunk {
    return new DocumentChunk(
      prismaChunk.id,
      prismaChunk.documentId,
      prismaChunk.content,
      prismaChunk.contentHash,
      prismaChunk.chunkIndex,
      prismaChunk.type,
      prismaChunk.metadata || {},
      prismaChunk.createdAt,
      prismaChunk.updatedAt,
    );
  }

  /**
   * Maps the string type of the entity to the enum ChunkType of Prisma
   */
  private mapTypeToChunkType(type: string): any {
    const typeMap: Record<string, any> = {
      text: 'TEXT',
      paragraph: 'TEXT',
      sentence_group: 'TEXT',
      word_group: 'TEXT',
      title: 'TITLE',
      table: 'TABLE',
      list: 'LIST',
      code: 'CODE',
      formula: 'FORMULA',
      metadata: 'METADATA',
    };

    return typeMap[type.toLowerCase()] || 'TEXT';
  }

  /**
   * Counts the number of words in a text
   */
  private countWords(text: string): number {
    if (!text || text.trim().length === 0) {
      return 0;
    }

    // Split by spaces and filter empty elements
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }
}
