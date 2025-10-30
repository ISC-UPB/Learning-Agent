import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { PrismaDocumentChunkRepositoryAdapter } from '../infrastructure/persistence/prisma-document-chunk-repository.adapter';
import { DocumentChunk } from '../domain/entities/document-chunk.entity';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('DocumentChunkRepository Idempotency', () => {
  let prismaService: PrismaService;
  let repository: PrismaDocumentChunkRepositoryAdapter;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        PrismaDocumentChunkRepositoryAdapter,
      ],
    }).compile();

    prismaService = moduleRef.get<PrismaService>(PrismaService);
    repository = moduleRef.get<PrismaDocumentChunkRepositoryAdapter>(PrismaDocumentChunkRepositoryAdapter);

    // Limpiar la base de datos antes de cada test
    await prismaService.documentChunk.deleteMany();
    await prismaService.documentCategoryMapping.deleteMany();
    await prismaService.documentCategory.deleteMany();
    await prismaService.examQuestion.deleteMany();
    await prismaService.exam.deleteMany();
    await prismaService.document.deleteMany();
    await prismaService.enrollment.deleteMany();
    await prismaService.classes.deleteMany();
    await prismaService.course.deleteMany();
    await prismaService.userRole.deleteMany();
    await prismaService.role.deleteMany();
    await prismaService.teacherProfile.deleteMany();
    await prismaService.studentProfile.deleteMany();
    await prismaService.user.deleteMany();

    // Crear usuario de prueba
    const testUser = await prismaService.user.create({
      data: {
        id: 'test-user',
        name: 'Test',
        lastname: 'User',
        email: 'test@example.com',
        password: 'testpass'
      }
    });

    // Crear documentos de prueba
    await prismaService.document.createMany({
      data: [
        { 
          id: 'test-doc-1', 
          originalName: 'test1.txt',
          storedName: 'test1-stored.txt',
          s3Key: 'test1-key',
          size: 1000,
          contentType: 'text/plain',
          fileHash: 'hash1',
          uploadedBy: testUser.id
        },
        { 
          id: 'test-doc-2', 
          originalName: 'test2.txt',
          storedName: 'test2-stored.txt',
          s3Key: 'test2-key',
          size: 1000,
          contentType: 'text/plain',
          fileHash: 'hash2',
          uploadedBy: testUser.id
        },
        { 
          id: 'doc-1', 
          originalName: 'doc1.txt',
          storedName: 'doc1-stored.txt',
          s3Key: 'doc1-key',
          size: 1000,
          contentType: 'text/plain',
          fileHash: 'hash3',
          uploadedBy: testUser.id
        },
        { 
          id: 'doc-2', 
          originalName: 'doc2.txt',
          storedName: 'doc2-stored.txt',
          s3Key: 'doc2-key',
          size: 1000,
          contentType: 'text/plain',
          fileHash: 'hash4',
          uploadedBy: testUser.id
        }
      ]
    });
  });

  it('should prevent duplicate chunks with same content in same document', async () => {
    // Arrange
    const documentId = 'test-doc-1';
    const content = 'Test content for deduplication';
    
    const chunk1 = new DocumentChunk(
      'chunk-1',
      documentId,
      content,
      1,
      'text',
      {},
      [],
    );

    const chunk2 = new DocumentChunk(
      'chunk-2',
      documentId,
      content, // mismo contenido
      2,
      'text',
      {},
      [],
    );

    // Act
    await repository.save(chunk1);
    
    // Assert
    await expect(repository.save(chunk2)).rejects.toThrow();

    // Verificar que solo existe un chunk
    const count = await prismaService.documentChunk.count({
      where: { documentId }
    });
    expect(count).toBe(1);
  });

  it('should handle retry scenarios gracefully', async () => {
    // Arrange
    const documentId = 'test-doc-2';
    const chunks = [
      new DocumentChunk('chunk-3', documentId, 'Content 1', 1, 'text', {}, []),
      new DocumentChunk('chunk-4', documentId, 'Content 2', 2, 'text', {}, []),
      new DocumentChunk('chunk-5', documentId, 'Content 1', 3, 'text', {}, []), // contenido duplicado
    ];

    // Act
    await repository.saveMany(chunks.slice(0, 2));

    // Assert
    // Intentar guardar de nuevo debería fallar para el contenido duplicado
    await expect(repository.saveMany([chunks[2]])).rejects.toThrow();

    // Verificar que solo existen dos chunks
    const savedChunks = await prismaService.documentChunk.findMany({
      where: { documentId },
      orderBy: { chunkIndex: 'asc' }
    });

    expect(savedChunks).toHaveLength(2);
    expect(savedChunks[0].content).toBe('Content 1');
    expect(savedChunks[1].content).toBe('Content 2');
  });

  it('should allow same content in different documents', async () => {
    // Arrange
    const content = 'Shared content between documents';
    const chunk1 = new DocumentChunk(
      'chunk-6',
      'doc-1',
      content,
      1,
      'text',
      {},
      [],
    );
    const chunk2 = new DocumentChunk(
      'chunk-7',
      'doc-2',
      content,
      1,
      'text',
      {},
      [],
    );

    // Act
    await repository.save(chunk1);
    await repository.save(chunk2);

    // Assert
    const chunks = await prismaService.documentChunk.findMany({
      where: {
        content
      }
    });

    expect(chunks).toHaveLength(2);
    expect(chunks[0].documentId).toBe('doc-1');
    expect(chunks[1].documentId).toBe('doc-2');
  });
});