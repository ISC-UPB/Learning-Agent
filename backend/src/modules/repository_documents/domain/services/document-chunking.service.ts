import type { DocumentChunk } from '../entities/document-chunk.entity';
import type {
  ChunkingStrategyPort,
  ChunkingConfig,
  ChunkingResult,
} from '../ports/chunking-strategy.port';
import type { DocumentChunkRepositoryPort } from '../ports/document-chunk-repository.port';

/**
 * Options for chunk processing
 */
export interface ProcessChunksOptions {
  /** Custom chunking configuration */
  chunkingConfig?: Partial<ChunkingConfig>;

  /** Whether to replace existing chunks */
  replaceExisting?: boolean;

  /** Custom chunk type */
  chunkType?: string;
}

/**
 * Complete chunk processing result
 */
export interface ProcessChunksResult {
  /** Chunking result */
  chunkingResult: ChunkingResult;

  /** Chunks saved in database */
  savedChunks: DocumentChunk[];

  /** Processing time in milliseconds */
  processingTimeMs: number;

  /** Processing status */
  status: 'success' | 'partial_success' | 'error';

  /** Error messages if any */
  errors?: string[];
}

/**
 * Domain service for document chunking
 */
export class DocumentChunkingService {
  constructor(
    private readonly chunkingStrategy: ChunkingStrategyPort,
    private readonly chunkRepository: DocumentChunkRepositoryPort,
  ) {}

  /**
   * Processes complete document: chunking + storage
   */
  async processDocumentChunks(
    documentId: string,
    extractedText: string,
    options: ProcessChunksOptions = {},
  ): Promise<ProcessChunksResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text to process');
      }

      const defaultConfig = this.chunkingStrategy.getDefaultConfig();
      const chunkingConfig: ChunkingConfig = {
        ...defaultConfig,
        ...options.chunkingConfig,
      };

      if (!this.chunkingStrategy.validateConfig(chunkingConfig)) {
        throw new Error('Invalid chunking configuration');
      }

      if (options.replaceExisting) {
        const hasExistingChunks =
          await this.chunkRepository.existsByDocumentId(documentId);
        if (hasExistingChunks) {
          await this.chunkRepository.deleteByDocumentId(documentId);
        }
      }
      const chunkingResult = await this.chunkingStrategy.chunkText(
        documentId,
        extractedText,
        chunkingConfig,
      );

      if (chunkingResult.chunks.length === 0) {
        throw new Error('Could not generate chunks from text');
      }
      if (options.chunkType) {
        chunkingResult.chunks.forEach((chunk) => {
          chunk.type = options.chunkType!;
        });
      }

      const savedChunks = await this.chunkRepository.saveMany(
        chunkingResult.chunks,
      );

      const processingTimeMs = Date.now() - startTime;

      return {
        chunkingResult,
        savedChunks,
        processingTimeMs,
        status: 'success',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      const processingTimeMs = Date.now() - startTime;

      return {
        chunkingResult: {
          chunks: [],
          totalChunks: 0,
          statistics: {
            averageChunkSize: 0,
            minChunkSize: 0,
            maxChunkSize: 0,
            actualOverlapPercentage: 0,
          },
        },
        savedChunks: [],
        processingTimeMs,
        status: 'error',
        errors,
      };
    }
  }

  /**
   * Gets document chunks with statistics
   */
  async getDocumentChunks(documentId: string) {
    const chunks = await this.chunkRepository.findByDocumentId(documentId);
    const statistics =
      await this.chunkRepository.getDocumentChunkStatistics(documentId);

    return {
      chunks: chunks.chunks,
      total: chunks.total,
      statistics,
    };
  }

  /**
   * Checks if document has processed chunks
   */
  async hasProcessedChunks(documentId: string): Promise<boolean> {
    return this.chunkRepository.existsByDocumentId(documentId);
  }

  /**
   * Re-processes document chunks
   */
  async reprocessDocumentChunks(
    documentId: string,
    extractedText: string,
    options: ProcessChunksOptions = {},
  ): Promise<ProcessChunksResult> {
    return this.processDocumentChunks(documentId, extractedText, {
      ...options,
      replaceExisting: true,
    });
  }
}
