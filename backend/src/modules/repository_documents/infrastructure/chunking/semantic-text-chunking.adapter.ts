import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DocumentChunk } from '../../domain/entities/document-chunk.entity';
import { DocumentChunkService } from '../../domain/services/document-chunk.service';
import type {
  ChunkingStrategyPort,
  ChunkingConfig,
  ChunkingResult,
} from '../../domain/ports/chunking-strategy.port';

/**
 * Adapter for semantic text chunking
 *
 * Implements an intelligent text splitting strategy that:
 * - Respects paragraphs and sentences
 * - Maintains semantic context
 * - Optimizes for embeddings
 * - Includes intelligent overlap
 */
@Injectable()
export class SemanticTextChunkingAdapter implements ChunkingStrategyPort {
  private readonly logger = new Logger(SemanticTextChunkingAdapter.name);

  /**
   * Split text into chunks using semantic strategy
   */
  async chunkText(
    documentId: string,
    text: string,
    config: ChunkingConfig,
  ): Promise<ChunkingResult> {
    this.logger.log(
      `Starting semantic chunking for document ${documentId}: ` +
        `${text.length} characters, maxSize: ${config.maxChunkSize}, overlap: ${config.overlap}`,
    );

    const startTime = Date.now();

    // 1. Clean and normalize text
    const cleanText = this.cleanText(text);

    // 2. Split into paragraphs if respected
    const paragraphs = config.respectParagraphs
      ? this.splitIntoParagraphs(cleanText)
      : [cleanText];

    const chunks: DocumentChunk[] = [];
    let chunkIndex = 0;

    // 3. Process each paragraph
    for (const paragraph of paragraphs) {
      if (paragraph.trim().length < config.minChunkSize) {
        continue; // Skip very small paragraphs
      }

      // If paragraph fits in one chunk, use it directly
      if (paragraph.length <= config.maxChunkSize) {
        const chunk = this.createChunk(
          documentId,
          paragraph.trim(),
          chunkIndex++,
          'paragraph',
        );
        if (chunk) chunks.push(chunk);
        continue;
      }

      // If paragraph is too large, split it
      const paragraphChunks = await this.chunkLargeText(
        documentId,
        paragraph,
        config,
        chunkIndex,
      );

      chunks.push(...paragraphChunks);
      chunkIndex += paragraphChunks.length;
    }

    // 4. Apply intelligent overlap
    const chunksWithOverlap = this.applyIntelligentOverlap(chunks, config);

    // 5. Calculate statistics
    const statistics = this.calculateStatistics(chunksWithOverlap, config);

    const processingTime = Date.now() - startTime;
    this.logger.log(
      `Chunking completed in ${processingTime}ms: ${chunksWithOverlap.length} chunks generated`,
    );

    return {
      chunks: chunksWithOverlap,
      totalChunks: chunksWithOverlap.length,
      statistics,
    };
  }

  /**
   * Validate chunking configuration
   */
  validateConfig(config: ChunkingConfig): boolean {
    if (config.maxChunkSize <= 0) return false;
    if (config.overlap < 0 || config.overlap >= config.maxChunkSize)
      return false;
    if (config.minChunkSize <= 0 || config.minChunkSize > config.maxChunkSize)
      return false;
    return true;
  }

  /**
   * Default configuration optimized for embeddings
   */
  getDefaultConfig(): ChunkingConfig {
    return {
      maxChunkSize: 1000, // Optimal size for embeddings
      overlap: 100, // 10% overlap
      respectParagraphs: true,
      respectSentences: true,
      minChunkSize: 50, // Minimum to be useful
    };
  }

  // ============ PRIVATE METHODS ============

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line breaks
      .replace(/\n{3,}/g, '\n\n') // Maximum 2 consecutive breaks
      .replace(/[ \t]+/g, ' ') // Multiple spaces to one
      .replace(/^\s+|\s+$/g, '') // General trim
      .replace(/\s*\n\s*/g, '\n'); // Clean spaces around \n
  }

  /**
   * Split text into paragraphs
   */
  private splitIntoParagraphs(text: string): string[] {
    return text
      .split(/\n\s*\n/) // Split by double line break
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  /**
   * Split large text into chunks respecting sentences
   */
  private async chunkLargeText(
    documentId: string,
    text: string,
    config: ChunkingConfig,
    startIndex: number,
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];

    if (config.respectSentences) {
      // Split by sentences
      const sentences = this.splitIntoSentences(text);
      let currentChunk = '';
      let chunkIndex = startIndex;

      for (const sentence of sentences) {
        const potentialChunk =
          currentChunk + (currentChunk ? ' ' : '') + sentence;

        if (potentialChunk.length <= config.maxChunkSize) {
          currentChunk = potentialChunk;
        } else {
          // Save current chunk if not empty
          if (currentChunk.trim()) {
            const chunk = this.createChunk(
              documentId,
              currentChunk.trim(),
              chunkIndex++,
              'sentence_group',
            );
            if (chunk) chunks.push(chunk);
          }

          // Start new chunk
          currentChunk = sentence;

          // If single sentence is too large, split by words
          if (sentence.length > config.maxChunkSize) {
            const wordChunks = this.chunkByWords(
              documentId,
              sentence,
              config,
              chunkIndex,
            );
            chunks.push(...wordChunks);
            chunkIndex += wordChunks.length;
            currentChunk = '';
          }
        }
      }

      // Add last chunk if something remains
      if (currentChunk.trim()) {
        const chunk = this.createChunk(
          documentId,
          currentChunk.trim(),
          chunkIndex,
          'sentence_group',
        );
        if (chunk) chunks.push(chunk);
      }
    } else {
      // Simple division by words
      const wordChunks = this.chunkByWords(
        documentId,
        text,
        config,
        startIndex,
      );
      chunks.push(...wordChunks);
    }

    return chunks;
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Regex to detect sentence endings (improved for Spanish)
    const sentenceEnders = /[.!?]+\s+(?=[A-ZÁÉÍÓÚÑ])/g;

    return text
      .split(sentenceEnders)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  /**
   * Split by words when sentences are too large
   */
  private chunkByWords(
    documentId: string,
    text: string,
    config: ChunkingConfig,
    startIndex: number,
  ): DocumentChunk[] {
    const words = text.split(/\s+/);
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let chunkIndex = startIndex;

    for (const word of words) {
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + word;

      if (potentialChunk.length <= config.maxChunkSize) {
        currentChunk = potentialChunk;
      } else {
        if (currentChunk.trim()) {
          const chunk = this.createChunk(
            documentId,
            currentChunk.trim(),
            chunkIndex++,
            'word_group',
          );
          if (chunk) chunks.push(chunk);
        }
        currentChunk = word;
      }
    }

    // Last chunk
    if (currentChunk.trim()) {
      const chunk = this.createChunk(
        documentId,
        currentChunk.trim(),
        chunkIndex,
        'word_group',
      );
      if (chunk) chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * Apply intelligent overlap between chunks
   */
  private applyIntelligentOverlap(
    chunks: DocumentChunk[],
    config: ChunkingConfig,
  ): DocumentChunk[] {
    if (chunks.length <= 1 || config.overlap === 0) {
      return chunks;
    }

    const chunksWithOverlap = [...chunks];

    for (let i = 1; i < chunksWithOverlap.length; i++) {
      const prevChunk = chunksWithOverlap[i - 1];
      const currentChunk = chunksWithOverlap[i];

      // Get words from end of previous chunk
      const prevWords = prevChunk.content.split(/\s+/);
      const overlapWords = Math.min(
        Math.floor(config.overlap / 10), // Word estimation
        Math.floor(prevWords.length / 3), // Maximum 1/3 of previous chunk
      );

      if (overlapWords > 0) {
        const overlapText = prevWords.slice(-overlapWords).join(' ');
        currentChunk.content = overlapText + ' ' + currentChunk.content;
      }
    }

    return chunksWithOverlap;
  }

  /**
   * Create a document chunk
   */
  private createChunk(
    documentId: string,
    content: string,
    chunkIndex: number,
    type: string,
  ): DocumentChunk | null {
    if (!content || content.trim().length === 0) {
      return null;
    }

    return DocumentChunkService.create(
      uuidv4(),
      documentId,
      content.trim(),
      chunkIndex,
      type,
      {
        contentLength: content.length,
        wordCount: content.split(/\s+/).length,
        position: chunkIndex,
      },
    );
  }

  /**
   * Calculate chunking process statistics
   */
  private calculateStatistics(chunks: DocumentChunk[], config: ChunkingConfig) {
    if (chunks.length === 0) {
      return {
        averageChunkSize: 0,
        minChunkSize: 0,
        maxChunkSize: 0,
        actualOverlapPercentage: 0,
      };
    }

    const sizes = chunks.map((chunk) => chunk.content.length);
    const totalSize = sizes.reduce((sum, size) => sum + size, 0);

    return {
      averageChunkSize: Math.round(totalSize / chunks.length),
      minChunkSize: Math.min(...sizes),
      maxChunkSize: Math.max(...sizes),
      actualOverlapPercentage:
        config.overlap > 0 ? (config.overlap / config.maxChunkSize) * 100 : 0,
    };
  }
}
