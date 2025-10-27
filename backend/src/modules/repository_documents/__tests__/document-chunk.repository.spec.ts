import { PrismaDocumentChunkRepositoryAdapter } from '../infrastructure/persistence/prisma-document-chunk-repository.adapter';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { DocumentChunk } from '../domain/entities/document-chunk.entity';

describe('PrismaDocumentChunkRepositoryAdapter (idempotencia)', () => {
  let prismaMock: any;
  let repository: PrismaDocumentChunkRepositoryAdapter;

  beforeEach(() => {
    prismaMock = {
      documentChunk: {
        create: jest.fn(),
        findFirst: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    repository = new PrismaDocumentChunkRepositoryAdapter(prismaMock as PrismaService);
  });

  it('crea un chunk nuevo correctamente', async () => {
    const chunk = DocumentChunk.create(
      '1',
      'doc1',
      'contenido único',
      0,
      'text',
      {},
      new Date(),
    );

    prismaMock.documentChunk.create.mockResolvedValue({
      ...chunk,
      chunkHash: 'hash1',
    });

    const result = await repository.save(chunk);

    expect(prismaMock.documentChunk.create).toHaveBeenCalled();
    expect(result.documentId).toBe('doc1');
  });

  it('detecta duplicado por hash (idempotencia)', async () => {
    const chunk = DocumentChunk.create(
      '2',
      'doc1',
      'contenido duplicado',
      0,
      'text',
      {},
      new Date(),
    );

    const existing = {
      ...chunk,
      id: 'existing',
      chunkHash: 'hash-duplicado',
    };


    prismaMock.documentChunk.create.mockRejectedValue({ code: 'P2002' });
    prismaMock.documentChunk.findFirst.mockResolvedValue(existing);

    const result = await repository.save(chunk);

    expect(result.id).toBe('existing');
    expect(prismaMock.documentChunk.findFirst).toHaveBeenCalled();
  });

  it(' guarda múltiples chunks con deduplicación', async () => {
    const chunks = [
      DocumentChunk.create('1', 'doc1', 'uno', 0, 'text', {}, new Date()),
      DocumentChunk.create('2', 'doc1', 'dos', 1, 'text', {}, new Date()),
    ];

    prismaMock.documentChunk.createMany.mockResolvedValue({ count: 2 });
    prismaMock.documentChunk.findMany.mockResolvedValue(chunks);

    const result = await repository.saveMany(chunks);

    expect(result.length).toBe(2);
    expect(prismaMock.documentChunk.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skipDuplicates: true,
      }),
    );
  });
});
