/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { DocumentChunkDeduplicationService } from '../../domain/services/document-chunk-deduplication.service';
import { DocumentChunk } from '../../domain/entities/document-chunk.entity';
import { DocumentChunkRepositoryPort } from '../../domain/ports/document-chunk-repository.port';

describe('DocumentChunkDeduplicationService', () => {
  let service: DocumentChunkDeduplicationService;
  let mockChunkRepository: DocumentChunkRepositoryPort & {
    findByContentHash: jest.Mock;
    findSimilarChunks: jest.Mock;
    findDuplicateChunks: jest.Mock;
  };

  beforeEach(async () => {
    mockChunkRepository = {
      findByContentHash: jest.fn(),
      findSimilarChunks: jest.fn(),
      findDuplicateChunks: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentChunkDeduplicationService,
        {
          provide: 'DocumentChunkRepositoryPort',
          useValue: mockChunkRepository,
        },
      ],
    }).compile();

    service = module.get<DocumentChunkDeduplicationService>(
      DocumentChunkDeduplicationService,
    );
  });

  describe('processChunks', () => {
    it('debe eliminar chunks duplicados basados en hash', async () => {
      const chunk1 = new DocumentChunk(
        '1',
        'doc1',
        'contenido 1',
        0,
        'text'
      );
      const chunk2 = new DocumentChunk(
        '2',
        'doc1',
        'contenido 1', // Mismo contenido que chunk1
        1,
        'text'
      );

      mockChunkRepository.findByContentHash.mockResolvedValue([]);

      const result = await service.processChunks([chunk1, chunk2]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('debe ignorar chunks que ya existen en la base de datos', async () => {
      const chunk = new DocumentChunk(
        '1',
        'doc1',
        'contenido nuevo',
        0,
        'text'
      );

      const existingChunk = new DocumentChunk(
        'existing',
        'doc1',
        'contenido nuevo',
        0,
        'text'
      );

      mockChunkRepository.findByContentHash.mockResolvedValue([existingChunk]);

      const result = await service.processChunks([chunk]);

      expect(result).toHaveLength(0);
    });
  });

  describe('processSimilarChunks', () => {
    it('debe identificar y filtrar chunks similares basados en embeddings', async () => {
      const chunk1 = new DocumentChunk(
        '1',
        'doc1',
        'contenido 1',
        0,
        'text',
        {},
        [0.1, 0.2, 0.3]
      );
      const chunk2 = new DocumentChunk(
        '2',
        'doc1',
        'contenido similar',
        1,
        'text',
        {},
        [0.11, 0.21, 0.31]
      );

      mockChunkRepository.findSimilarChunks
        .mockResolvedValueOnce([]) // Para el primer chunk
        .mockResolvedValueOnce([chunk1]); // Para el segundo chunk (similar al primero)

      const result = await service.processSimilarChunks([chunk1, chunk2]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('debe mantener chunks sin embeddings', async () => {
      const chunk = new DocumentChunk(
        '1',
        'doc1',
        'contenido sin embedding',
        0,
        'text'
      );

      const result = await service.processSimilarChunks([chunk]);

      expect(result).toHaveLength(1);
      expect(mockChunkRepository.findSimilarChunks).not.toHaveBeenCalled();
    });
  });

  describe('findAndResolveDuplicates', () => {
    it('debe identificar chunks duplicados en un documento', async () => {
      const duplicates = [
        new DocumentChunk('1', 'doc1', 'contenido duplicado', 0, 'text'),
        new DocumentChunk('2', 'doc1', 'contenido duplicado', 1, 'text'),
      ];

      mockChunkRepository.findDuplicateChunks.mockResolvedValue(duplicates);

      await service.findAndResolveDuplicates('doc1');

      expect(mockChunkRepository.findDuplicateChunks).toHaveBeenCalledWith('doc1');
    });
  });
});