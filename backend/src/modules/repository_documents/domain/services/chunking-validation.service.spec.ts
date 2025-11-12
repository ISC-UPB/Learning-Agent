import { Test, TestingModule } from '@nestjs/testing';
import { ChunkingValidationService } from './chunking-validation.service';
import { CHUNKING_LIMITS } from '../../infrastructure/config/chunking.config';
import {
  ChunkingLimitExceededError,
  DocumentSizeExceededError,
  InvalidChunkingConfigError,
} from '../../../../shared/exceptions/document.exceptions';
import type { ChunkingConfig } from '../ports/chunking-strategy.port';

describe('ChunkingValidationService', () => {
  let service: ChunkingValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChunkingValidationService],
    }).compile();

    service = module.get<ChunkingValidationService>(ChunkingValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateDocumentSize', () => {
    it('should pass for valid document size', () => {
      const validSize = 50000; // 50k characters
      expect(() => service.validateDocumentSize(validSize)).not.toThrow();
    });

    it('should throw DocumentSizeExceededError for oversized document', () => {
      const oversizedDocument = CHUNKING_LIMITS.MAX_TEXT_LENGTH_CHARS + 1;
      
      expect(() => service.validateDocumentSize(oversizedDocument)).toThrow(
        DocumentSizeExceededError,
      );
    });

    it('should include actual and max size in error', () => {
      const oversizedDocument = CHUNKING_LIMITS.MAX_TEXT_LENGTH_CHARS + 1000;
      
      try {
        service.validateDocumentSize(oversizedDocument);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(DocumentSizeExceededError);
        expect(error.actualSize).toBe(oversizedDocument);
        expect(error.maxSize).toBe(CHUNKING_LIMITS.MAX_TEXT_LENGTH_CHARS);
      }
    });

    it('should pass for document at exact size limit', () => {
      const exactLimit = CHUNKING_LIMITS.MAX_TEXT_LENGTH_CHARS;
      expect(() => service.validateDocumentSize(exactLimit)).not.toThrow();
    });
  });

  describe('validateChunkCount', () => {
    it('should pass for valid chunk count', () => {
      const validCount = 100;
      expect(() => service.validateChunkCount(validCount)).not.toThrow();
    });

    it('should throw ChunkingLimitExceededError for excessive chunks', () => {
      const excessiveChunks = CHUNKING_LIMITS.MAX_CHUNKS_PER_DOCUMENT + 1;
      
      expect(() => service.validateChunkCount(excessiveChunks)).toThrow(
        ChunkingLimitExceededError,
      );
    });

    it('should include actual and limit in error', () => {
      const excessiveChunks = CHUNKING_LIMITS.MAX_CHUNKS_PER_DOCUMENT + 50;
      
      try {
        service.validateChunkCount(excessiveChunks);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ChunkingLimitExceededError);
        expect(error.actualValue).toBe(excessiveChunks);
        expect(error.limit).toBe(CHUNKING_LIMITS.MAX_CHUNKS_PER_DOCUMENT);
      }
    });

    it('should pass for chunk count at exact limit', () => {
      const exactLimit = CHUNKING_LIMITS.MAX_CHUNKS_PER_DOCUMENT;
      expect(() => service.validateChunkCount(exactLimit)).not.toThrow();
    });
  });

  describe('validateChunkingConfig', () => {
    const validConfig: ChunkingConfig = {
      maxChunkSize: 1000,
      minChunkSize: 50,
      overlap: 100,
      respectParagraphs: true,
      respectSentences: true,
    };

    it('should pass for valid config', () => {
      const result = service.validateChunkingConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should throw for maxChunkSize <= 0', () => {
      const invalidConfig = { ...validConfig, maxChunkSize: 0 };
      
      expect(() => service.validateChunkingConfig(invalidConfig)).toThrow(
        InvalidChunkingConfigError,
      );
    });

    it('should throw for maxChunkSize exceeding limit', () => {
      const invalidConfig = {
        ...validConfig,
        maxChunkSize: CHUNKING_LIMITS.MAX_CHUNK_SIZE + 1,
      };
      
      expect(() => service.validateChunkingConfig(invalidConfig)).toThrow(
        InvalidChunkingConfigError,
      );
    });

    it('should throw for minChunkSize <= 0', () => {
      const invalidConfig = { ...validConfig, minChunkSize: 0 };
      
      expect(() => service.validateChunkingConfig(invalidConfig)).toThrow(
        InvalidChunkingConfigError,
      );
    });

    it('should throw for minChunkSize > maxChunkSize', () => {
      const invalidConfig = {
        ...validConfig,
        minChunkSize: 1500,
        maxChunkSize: 1000,
      };
      
      expect(() => service.validateChunkingConfig(invalidConfig)).toThrow(
        InvalidChunkingConfigError,
      );
    });

    it('should throw for negative overlap', () => {
      const invalidConfig = { ...validConfig, overlap: -1 };
      
      expect(() => service.validateChunkingConfig(invalidConfig)).toThrow(
        InvalidChunkingConfigError,
      );
    });

    it('should throw for overlap >= maxChunkSize', () => {
      const invalidConfig = { ...validConfig, overlap: 1000 };
      
      expect(() => service.validateChunkingConfig(invalidConfig)).toThrow(
        InvalidChunkingConfigError,
      );
    });

    it('should warn but not throw for small minChunkSize', () => {
      const configWithSmallMin = {
        ...validConfig,
        minChunkSize: CHUNKING_LIMITS.MIN_CHUNK_SIZE - 1,
      };
      
      const result = service.validateChunkingConfig(configWithSmallMin);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn but not throw for large overlap', () => {
      const configWithLargeOverlap = {
        ...validConfig,
        overlap: CHUNKING_LIMITS.MAX_OVERLAP + 1,
      };
      
      const result = service.validateChunkingConfig(configWithLargeOverlap);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should throw for multiple validation errors', () => {
      const invalidConfig: ChunkingConfig = {
        maxChunkSize: -1,
        minChunkSize: 0,
        overlap: -1,
        respectParagraphs: true,
        respectSentences: true,
      };
      
      try {
        service.validateChunkingConfig(invalidConfig);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidChunkingConfigError);
        expect(error.message).toContain('maxChunkSize');
        expect(error.message).toContain('minChunkSize');
        expect(error.message).toContain('overlap');
      }
    });
  });

  describe('estimateChunkCount', () => {
    const config: ChunkingConfig = {
      maxChunkSize: 1000,
      minChunkSize: 50,
      overlap: 100,
      respectParagraphs: true,
      respectSentences: true,
    };

    it('should estimate chunk count correctly', () => {
      const textLength = 5000;
      const estimated = service.estimateChunkCount(textLength, config);
      
      expect(estimated).toBe(6);
    });

    it('should estimate 1 chunk for small text', () => {
      const textLength = 500;
      const estimated = service.estimateChunkCount(textLength, config);
      
      expect(estimated).toBe(1);
    });

    it('should handle no overlap correctly', () => {
      const configNoOverlap = { ...config, overlap: 0 };
      const textLength = 5000;
      const estimated = service.estimateChunkCount(textLength, configNoOverlap);
      
      expect(estimated).toBe(5);
    });

    it('should estimate higher count for high overlap', () => {
      const configHighOverlap = { ...config, overlap: 500 };
      const textLength = 5000;
      const estimated = service.estimateChunkCount(textLength, configHighOverlap);
      
      expect(estimated).toBe(10);
    });
  });

  describe('validateBeforeChunking', () => {
    const validConfig: ChunkingConfig = {
      maxChunkSize: 1000,
      minChunkSize: 50,
      overlap: 100,
      respectParagraphs: true,
      respectSentences: true,
    };

    it('should pass for valid document and config', () => {
      const textLength = 50000;
      
      expect(() =>
        service.validateBeforeChunking(textLength, validConfig),
      ).not.toThrow();
    });

    it('should throw for oversized document', () => {
      const oversizedDoc = CHUNKING_LIMITS.MAX_TEXT_LENGTH_CHARS + 1;
      
      expect(() =>
        service.validateBeforeChunking(oversizedDoc, validConfig),
      ).toThrow(DocumentSizeExceededError);
    });

    it('should throw for invalid config', () => {
      const invalidConfig = { ...validConfig, maxChunkSize: -1 };
      
      expect(() =>
        service.validateBeforeChunking(50000, invalidConfig),
      ).toThrow(InvalidChunkingConfigError);
    });

    it('should throw if estimated chunks exceed limit', () => {
      const configTinyChunks: ChunkingConfig = {
        maxChunkSize: 100,
        minChunkSize: 50,
        overlap: 10,
        respectParagraphs: false,
        respectSentences: false,
      };
      
      const textLength = 100000;
      
      expect(() =>
        service.validateBeforeChunking(textLength, configTinyChunks),
      ).toThrow(ChunkingLimitExceededError);
    });

    it('should include helpful message for excessive chunks', () => {
      const configTinyChunks: ChunkingConfig = {
        maxChunkSize: 50,
        minChunkSize: 25,
        overlap: 5,
        respectParagraphs: false,
        respectSentences: false,
      };
      
      const textLength = 100000;
      
      try {
        service.validateBeforeChunking(textLength, configTinyChunks);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ChunkingLimitExceededError);
        expect(error.message).toContain('larger chunk size');
        expect(error.message).toContain('batches');
      }
    });

    it('should pass for document at exact chunk limit', () => {
      const config: ChunkingConfig = {
        maxChunkSize: 1000,
        minChunkSize: 50,
        overlap: 0,
        respectParagraphs: false,
        respectSentences: false,
      };
      
      const textLength = CHUNKING_LIMITS.MAX_CHUNKS_PER_DOCUMENT * 1000;
      
      expect(() =>
        service.validateBeforeChunking(textLength, config),
      ).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle zero text length', () => {
      expect(() => service.validateDocumentSize(0)).not.toThrow();
    });

    it('should handle zero chunks', () => {
      expect(() => service.validateChunkCount(0)).not.toThrow();
    });

    it('should handle config with all boolean flags false', () => {
      const config: ChunkingConfig = {
        maxChunkSize: 1000,
        minChunkSize: 50,
        overlap: 100,
        respectParagraphs: false,
        respectSentences: false,
      };
      
      const result = service.validateChunkingConfig(config);
      expect(result.isValid).toBe(true);
    });

    it('should handle minimal valid config', () => {
      const minimalConfig: ChunkingConfig = {
        maxChunkSize: CHUNKING_LIMITS.MIN_CHUNK_SIZE + 1,
        minChunkSize: CHUNKING_LIMITS.MIN_CHUNK_SIZE,
        overlap: 0,
        respectParagraphs: false,
        respectSentences: false,
      };
      
      const result = service.validateChunkingConfig(minimalConfig);
      expect(result.isValid).toBe(true);
    });

    it('should handle maximum valid config', () => {
      const maximalConfig: ChunkingConfig = {
        maxChunkSize: CHUNKING_LIMITS.MAX_CHUNK_SIZE,
        minChunkSize: CHUNKING_LIMITS.MIN_CHUNK_SIZE,
        overlap: CHUNKING_LIMITS.MAX_OVERLAP,
        respectParagraphs: true,
        respectSentences: true,
      };
      
      const result = service.validateChunkingConfig(maximalConfig);
      expect(result.isValid).toBe(true);
    });
  });
});
