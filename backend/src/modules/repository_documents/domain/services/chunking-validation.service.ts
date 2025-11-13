import { Injectable, Logger } from '@nestjs/common';
import { CHUNKING_LIMITS } from '../../infrastructure/config/chunking.config';
import {
  ChunkingLimitExceededError,
  DocumentSizeExceededError,
  InvalidChunkingConfigError,
} from '../../../../shared/exceptions/document.exceptions';
import type { ChunkingConfig } from '../../domain/ports/chunking-strategy.port';

export interface ChunkingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  estimatedChunks: number;
}

@Injectable()
export class ChunkingValidationService {
  private readonly logger = new Logger(ChunkingValidationService.name);

  validateDocumentSize(textLength: number): void {
    if (textLength > CHUNKING_LIMITS.MAX_TEXT_LENGTH_CHARS) {
      throw new DocumentSizeExceededError(
        `Document text exceeds maximum allowed length of ${CHUNKING_LIMITS.MAX_TEXT_LENGTH_CHARS} characters`,
        textLength,
        CHUNKING_LIMITS.MAX_TEXT_LENGTH_CHARS,
      );
    }
  }

  validateChunkCount(chunkCount: number): void {
    if (chunkCount > CHUNKING_LIMITS.MAX_CHUNKS_PER_DOCUMENT) {
      throw new ChunkingLimitExceededError(
        `Document generated ${chunkCount} chunks, exceeding the maximum limit of ${CHUNKING_LIMITS.MAX_CHUNKS_PER_DOCUMENT}`,
        chunkCount,
        CHUNKING_LIMITS.MAX_CHUNKS_PER_DOCUMENT,
      );
    }
  }

  validateChunkingConfig(config: ChunkingConfig): ChunkingValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.maxChunkSize <= 0) {
      errors.push('maxChunkSize must be greater than 0');
    }

    if (config.maxChunkSize > CHUNKING_LIMITS.MAX_CHUNK_SIZE) {
      errors.push(
        `maxChunkSize cannot exceed ${CHUNKING_LIMITS.MAX_CHUNK_SIZE}`,
      );
    }

    if (config.minChunkSize <= 0) {
      errors.push('minChunkSize must be greater than 0');
    }

    if (config.minChunkSize < CHUNKING_LIMITS.MIN_CHUNK_SIZE) {
      warnings.push(
        `minChunkSize is below recommended minimum of ${CHUNKING_LIMITS.MIN_CHUNK_SIZE}`,
      );
    }

    if (config.minChunkSize > config.maxChunkSize) {
      errors.push('minChunkSize cannot be greater than maxChunkSize');
    }

    if (config.overlap < 0) {
      errors.push('overlap cannot be negative');
    }

    if (config.overlap >= config.maxChunkSize) {
      errors.push('overlap must be less than maxChunkSize');
    }

    if (config.overlap > CHUNKING_LIMITS.MAX_OVERLAP) {
      warnings.push(
        `overlap exceeds recommended maximum of ${CHUNKING_LIMITS.MAX_OVERLAP}`,
      );
    }

    if (errors.length > 0) {
      throw new InvalidChunkingConfigError(
        `Invalid chunking configuration: ${errors.join(', ')}`,
        Object.keys(config),
      );
    }

    if (warnings.length > 0) {
      this.logger.warn(`Chunking config warnings: ${warnings.join(', ')}`);
    }

    return {
      isValid: true,
      errors,
      warnings,
      estimatedChunks: 0,
    };
  }

  estimateChunkCount(
    textLength: number,
    config: ChunkingConfig,
  ): number {
    const effectiveChunkSize = config.maxChunkSize - config.overlap;
    const estimated = Math.ceil(textLength / effectiveChunkSize);
    
    this.logger.log(
      `Estimated ${estimated} chunks for ${textLength} characters ` +
      `(chunkSize: ${config.maxChunkSize}, overlap: ${config.overlap})`,
    );
    
    return estimated;
  }

  validateBeforeChunking(
    textLength: number,
    config: ChunkingConfig,
  ): void {
    this.validateDocumentSize(textLength);
    this.validateChunkingConfig(config);

    const estimatedChunks = this.estimateChunkCount(textLength, config);
    
    if (estimatedChunks > CHUNKING_LIMITS.MAX_CHUNKS_PER_DOCUMENT) {
      throw new ChunkingLimitExceededError(
        `Estimated ${estimatedChunks} chunks would exceed the maximum limit of ${CHUNKING_LIMITS.MAX_CHUNKS_PER_DOCUMENT}. ` +
        `Consider using a larger chunk size or processing the document in batches.`,
        estimatedChunks,
        CHUNKING_LIMITS.MAX_CHUNKS_PER_DOCUMENT,
      );
    }
  }
}
