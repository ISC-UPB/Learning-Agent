import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { UploadDocumentUseCase } from '../src/modules/repository_documents/application/commands/upload-document.usecase';
import { PrismaDocumentRepositoryAdapter } from '../src/modules/repository_documents/infrastructure/persistence/prisma-document-repository.adapter';
import { DocumentChunkingService } from '../src/modules/repository_documents/domain/services/document-chunking.service';
import { DocumentStoragePort } from '../src/modules/repository_documents/domain/ports/document-storage.port';
import { DocumentNotSavedError } from '../src/shared/exceptions/document.exceptions';

describe('Atomic Document Upload E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let uploadUseCase: UploadDocumentUseCase;
  let documentRepository: PrismaDocumentRepositoryAdapter;
  let storageAdapter: jest.Mocked<DocumentStoragePort>;

  beforeAll(async () => {
    storageAdapter = {
      uploadDocument: jest.fn(),
      softDeleteDocument: jest.fn(),
      deleteFile: jest.fn(),
      exists: jest.fn(),
    } as any;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        PrismaDocumentRepositoryAdapter,
        DocumentChunkingService,
        UploadDocumentUseCase,
        {
          provide: 'DocumentStoragePort',
          useValue: storageAdapter,
        },
        {
          provide: 'DocumentRepositoryPort',
          useFactory: (prisma: PrismaService) =>
            new PrismaDocumentRepositoryAdapter(prisma),
          inject: [PrismaService],
        },
        {
          provide: 'DocumentChunkRepositoryPort',
          useFactory: (prisma: PrismaService) => ({
            saveMany: jest.fn(),
            updateBatchEmbeddings: jest.fn(),
          }),
          inject: [PrismaService],
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    uploadUseCase = moduleFixture.get<UploadDocumentUseCase>(UploadDocumentUseCase);
    documentRepository = moduleFixture.get<PrismaDocumentRepositoryAdapter>(
      PrismaDocumentRepositoryAdapter,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.documentChunk.deleteMany();
    await prisma.document.deleteMany();
  });

  describe('Atomic transaction with rollback', () => {
    const mockFile = {
      buffer: Buffer.from('PDF content'),
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    } as Express.Multer.File;

    const mockPreGeneratedChunks = [
      { content: 'Chunk 1 content', metadata: { page: 1 } },
      { content: 'Chunk 2 content', metadata: { page: 2 } },
    ];

    const mockPreGeneratedEmbeddings = [
      [0.1, 0.2, 0.3, 0.4],
      [0.5, 0.6, 0.7, 0.8],
    ];

    it('should rollback entire transaction if database operation fails mid-transaction', async () => {
      storageAdapter.uploadDocument.mockResolvedValue({
        fileName: 'test-rollback.pdf',
        url: 'http://test.com/test-rollback.pdf',
      } as any);

      storageAdapter.softDeleteDocument.mockResolvedValue(undefined);

      const mockSaveWithChunksAndEmbeddings = jest
        .spyOn(documentRepository, 'saveWithChunksAndEmbeddings')
        .mockRejectedValue(new Error('Simulated transaction failure'));

      try {
        await uploadUseCase.execute(mockFile, 'test-user', {
          reuseGeneratedData: true,
          preGeneratedChunks: mockPreGeneratedChunks,
          preGeneratedEmbeddings: mockPreGeneratedEmbeddings,
          extractedText: 'Extracted text',
        });
        fail('Should have thrown DocumentNotSavedError');
      } catch (error) {
        expect(error).toBeInstanceOf(DocumentNotSavedError);
      }

      const documentsInDB = await prisma.document.findMany();
      expect(documentsInDB).toHaveLength(0);

      const chunksInDB = await prisma.documentChunk.findMany();
      expect(chunksInDB).toHaveLength(0);

      expect(storageAdapter.softDeleteDocument).toHaveBeenCalledWith('test-rollback.pdf');

      mockSaveWithChunksAndEmbeddings.mockRestore();
    });

    it('should verify storage file is soft-deleted after transaction rollback', async () => {
      const testFileName = 'test-storage-rollback.pdf';

      storageAdapter.uploadDocument.mockResolvedValue({
        fileName: testFileName,
        url: `http://test.com/${testFileName}`,
      } as any);

      let softDeleteCalled = false;
      storageAdapter.softDeleteDocument.mockImplementation(async (fileName) => {
        expect(fileName).toBe(testFileName);
        softDeleteCalled = true;
        return undefined;
      });

      jest
        .spyOn(documentRepository, 'saveWithChunksAndEmbeddings')
        .mockRejectedValue(new Error('Database failure'));

      try {
        await uploadUseCase.execute(mockFile, 'test-user', {
          reuseGeneratedData: true,
          preGeneratedChunks: mockPreGeneratedChunks,
          preGeneratedEmbeddings: mockPreGeneratedEmbeddings,
        });
      } catch (error) {
        // Expected error
      }

      expect(softDeleteCalled).toBe(true);

      const documentsInDB = await prisma.document.findMany();
      expect(documentsInDB).toHaveLength(0);
    });

    it('should not have orphaned chunks after failed transaction', async () => {
      storageAdapter.uploadDocument.mockResolvedValue({
        fileName: 'test-orphan-check.pdf',
        url: 'http://test.com/test-orphan-check.pdf',
      } as any);

      storageAdapter.softDeleteDocument.mockResolvedValue(undefined);

      jest
        .spyOn(documentRepository, 'saveWithChunksAndEmbeddings')
        .mockRejectedValue(new Error('Transaction aborted'));

      try {
        await uploadUseCase.execute(mockFile, 'test-user', {
          reuseGeneratedData: true,
          preGeneratedChunks: mockPreGeneratedChunks,
          preGeneratedEmbeddings: mockPreGeneratedEmbeddings,
          extractedText: 'Test text',
        });
      } catch (error) {
        // Expected
      }

      const documentsInDB = await prisma.document.findMany();
      const chunksInDB = await prisma.documentChunk.findMany();

      expect(documentsInDB).toHaveLength(0);
      expect(chunksInDB).toHaveLength(0);
    });
  });
});
