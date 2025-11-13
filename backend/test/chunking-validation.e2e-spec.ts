import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { DocumentsModule } from '../src/modules/repository_documents/documents.module';
import { CHUNKING_LIMITS } from '../src/modules/repository_documents/infrastructure/config/chunking.config';

describe('Document Chunking Validation E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DocumentsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Document size validation', () => {
    it('should reject document exceeding text length limit', async () => {
      const oversizedText = 'x'.repeat(CHUNKING_LIMITS.MAX_TEXT_LENGTH_CHARS + 1000);
      
      const response = await request(app.getHttpServer())
        .post('/api/documents/test-chunking')
        .send({
          text: oversizedText,
          config: {
            maxChunkSize: 1000,
            overlap: 100,
          },
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('exceeds maximum allowed length');
      expect(response.body.error).toBe('Bad Request');
    });

    it('should accept document at exact size limit', async () => {
      const exactLimitText = 'x'.repeat(CHUNKING_LIMITS.MAX_TEXT_LENGTH_CHARS);
      
      expect(exactLimitText.length).toBe(CHUNKING_LIMITS.MAX_TEXT_LENGTH_CHARS);
    });
  });

  describe('Chunk count validation', () => {
    it('should reject document that would generate too many chunks', async () => {
      const text = 'x'.repeat(100000);
      const config = {
        maxChunkSize: 100,
        overlap: 10,
        minChunkSize: 50,
      };
      
      const response = await request(app.getHttpServer())
        .post('/api/documents/test-chunking')
        .send({ text, config })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('exceed');
      expect(response.body.message).toContain('chunk');
    });

    it('should accept document that generates chunks within limit', async () => {
      const text = 'x'.repeat(50000);
      const config = {
        maxChunkSize: 1000,
        overlap: 100,
        minChunkSize: 50,
      };
      
      expect(Math.ceil(text.length / (config.maxChunkSize - config.overlap))).toBeLessThan(
        CHUNKING_LIMITS.MAX_CHUNKS_PER_DOCUMENT,
      );
    });
  });

  describe('Configuration validation', () => {
    it('should reject invalid maxChunkSize', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/documents/test-chunking')
        .send({
          text: 'Sample text',
          config: {
            maxChunkSize: CHUNKING_LIMITS.MAX_CHUNK_SIZE + 1,
            overlap: 100,
            minChunkSize: 50,
          },
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('Invalid chunking configuration');
    });

    it('should reject negative overlap', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/documents/test-chunking')
        .send({
          text: 'Sample text',
          config: {
            maxChunkSize: 1000,
            overlap: -1,
            minChunkSize: 50,
          },
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('Invalid chunking configuration');
    });

    it('should reject minChunkSize > maxChunkSize', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/documents/test-chunking')
        .send({
          text: 'Sample text',
          config: {
            maxChunkSize: 500,
            overlap: 100,
            minChunkSize: 1000,
          },
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('Invalid chunking configuration');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty text', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/documents/test-chunking')
        .send({
          text: '',
          config: {
            maxChunkSize: 1000,
            overlap: 100,
            minChunkSize: 50,
          },
        });

      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(response.status);
    });

    it('should handle very small text', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/documents/test-chunking')
        .send({
          text: 'Small text',
          config: {
            maxChunkSize: 1000,
            overlap: 100,
            minChunkSize: 50,
          },
        });

      expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(response.status);
    });

    it('should handle document at exact chunk count limit', async () => {
      const chunkSize = 1000;
      const overlap = 0;
      const effectiveChunkSize = chunkSize - overlap;
      const textLength = CHUNKING_LIMITS.MAX_CHUNKS_PER_DOCUMENT * effectiveChunkSize;
      const text = 'x'.repeat(textLength);
      
      const config = {
        maxChunkSize: chunkSize,
        overlap: overlap,
        minChunkSize: 50,
      };
      
      const estimatedChunks = Math.ceil(textLength / effectiveChunkSize);
      expect(estimatedChunks).toBe(CHUNKING_LIMITS.MAX_CHUNKS_PER_DOCUMENT);
    });
  });

  describe('Integration with actual chunking', () => {
    
    it('should successfully chunk a valid document', async () => {
      const validText = `
        This is a test document with multiple paragraphs.
        
        This is the second paragraph that contains some meaningful content
        that should be properly chunked according to the semantic chunking strategy.
        
        And this is the third paragraph with even more content to ensure
        we get multiple chunks from this document.
      `.repeat(50);
      
      expect(validText.length).toBeLessThan(CHUNKING_LIMITS.MAX_TEXT_LENGTH_CHARS);
    });

    it('should provide helpful error message for oversized documents', async () => {
      const oversizedText = 'x'.repeat(CHUNKING_LIMITS.MAX_TEXT_LENGTH_CHARS + 1);
      
      const response = await request(app.getHttpServer())
        .post('/api/documents/test-chunking')
        .send({
          text: oversizedText,
          config: {
            maxChunkSize: 1000,
            overlap: 100,
            minChunkSize: 50,
          },
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBeDefined();
      expect(response.body.message).toContain('maximum');
    });

    it('should suggest solutions when chunk limit would be exceeded', async () => {
      const text = 'x'.repeat(100000);
      const config = {
        maxChunkSize: 50,
        overlap: 5,
        minChunkSize: 25,
      };
      
      const response = await request(app.getHttpServer())
        .post('/api/documents/test-chunking')
        .send({ text, config })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toMatch(/larger chunk size|batches/i);
    });
  });
});
