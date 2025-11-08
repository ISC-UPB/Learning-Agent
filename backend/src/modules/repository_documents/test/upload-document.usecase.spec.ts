import { Test, TestingModule } from '@nestjs/testing';
import { UploadDocumentUseCase } from '../application/commands/upload-document.usecase';
import { DocumentStoragePort } from '../domain/ports/document-storage.port';
import { DocumentRepositoryPort } from '../domain/ports/document-repository.port';
import { Document, DocumentStatus } from '../domain/entities/document.entity';
import { DocumentChunkingService } from '../domain/services/document-chunking.service';
import { BadRequestException } from '@nestjs/common';
import {
  DocumentNotSavedError,
  StorageRollbackError,
} from '../../../shared/exceptions/document.exceptions';

describe('UploadDocumentUseCase', () => {
  let useCase: UploadDocumentUseCase;
  let storageAdapter: jest.Mocked<DocumentStoragePort>;
  let documentRepository: jest.Mocked<DocumentRepositoryPort>;
  let chunkingService: jest.Mocked<DocumentChunkingService>;

  const mockFile = {
    buffer: Buffer.from('test content'),
    originalname: 'test.pdf',
    mimetype: 'application/pdf',
    size: 1024,
  } as Express.Multer.File;

  const mockDocument = {
    id: 'test-id',
    fileName: 'test.pdf',
    originalName: 'test.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    url: 'http://test.com/test.pdf',
    s3Key: 'test.pdf',
    fileHash: 'test-hash',
    uploadedBy: 'test-user',
    status: DocumentStatus.UPLOADED,
  } as Document;

  beforeEach(async () => {
    // Mock implementations
    storageAdapter = {
      uploadDocument: jest.fn(),
      deleteFile: jest.fn(),
      exists: jest.fn(),
    } as any;

    documentRepository = {
      save: jest.fn(),
      findByFileHash: jest.fn(),
    } as any;

    chunkingService = {
      processChunks: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadDocumentUseCase,
        {
          provide: 'DocumentStoragePort',
          useValue: storageAdapter,
        },
        {
          provide: 'DocumentRepositoryPort',
          useValue: documentRepository,
        },
        {
          provide: DocumentChunkingService,
          useValue: chunkingService,
        },
      ],
    }).compile();

    useCase = module.get<UploadDocumentUseCase>(UploadDocumentUseCase);
  });

  it('should upload document successfully', async () => {
    // Arrange
    storageAdapter.uploadDocument.mockResolvedValue(mockDocument);
    documentRepository.findByFileHash.mockResolvedValue(undefined);
    documentRepository.save.mockResolvedValue(mockDocument);

    // Act
    const result = await useCase.execute(mockFile, 'test-user');

    // Assert
    expect(result).toBeDefined();
    expect(result.id).toBe(mockDocument.id);
    expect(storageAdapter.uploadDocument).toHaveBeenCalled();
    expect(documentRepository.save).toHaveBeenCalled();
    expect(storageAdapter.deleteFile).not.toHaveBeenCalled();
  });

  it('should rollback storage upload if database save fails', async () => {
    // Arrange
    storageAdapter.uploadDocument.mockResolvedValue(mockDocument);
    documentRepository.findByFileHash.mockResolvedValue(undefined);
    documentRepository.save.mockRejectedValue(new Error('Database error'));

    // Act & Assert
    await expect(useCase.execute(mockFile, 'test-user')).rejects.toThrow();
    expect(storageAdapter.uploadDocument).toHaveBeenCalled();
    expect(documentRepository.save).toHaveBeenCalled();
    expect(storageAdapter.deleteFile).toHaveBeenCalledWith(mockDocument.fileName, true);
  });

  it('should not upload duplicate documents', async () => {
    // Arrange
    documentRepository.findByFileHash.mockResolvedValue(mockDocument);

    // Act & Assert
    await expect(useCase.execute(mockFile, 'test-user')).rejects.toThrow(
      BadRequestException,
    );
    expect(storageAdapter.uploadDocument).not.toHaveBeenCalled();
    expect(documentRepository.save).not.toHaveBeenCalled();
  });

  it('should handle storage upload failure', async () => {
    // Arrange
    storageAdapter.uploadDocument.mockRejectedValue(
      new Error('Storage upload failed'),
    );
    documentRepository.findByFileHash.mockResolvedValue(undefined);

    // Act & Assert
    await expect(useCase.execute(mockFile, 'test-user')).rejects.toThrow(
      'Storage upload failed',
    );
    expect(documentRepository.save).not.toHaveBeenCalled();
    expect(storageAdapter.deleteFile).not.toHaveBeenCalled();
  });

  describe('Atomic Transaction Tests', () => {
    const mockPreGeneratedChunks = [
      { content: 'chunk1', metadata: { page: 1 } },
      { content: 'chunk2', metadata: { page: 2 } },
    ];

    const mockPreGeneratedEmbeddings = [
      [0.1, 0.2, 0.3],
      [0.4, 0.5, 0.6],
    ];

    const mockOptions = {
      reuseGeneratedData: true,
      preGeneratedChunks: mockPreGeneratedChunks,
      preGeneratedEmbeddings: mockPreGeneratedEmbeddings,
      extractedText: 'Extracted text content',
    };

    beforeEach(() => {
      documentRepository.saveWithChunksAndEmbeddings = jest.fn();
      storageAdapter.softDeleteDocument = jest.fn();
    });

    it('should save document atomically with pre-generated chunks and embeddings', async () => {
      // Arrange
      storageAdapter.uploadDocument.mockResolvedValue({
        fileName: 'test.pdf',
        url: 'http://test.com/test.pdf',
      } as any);
      documentRepository.findByFileHash.mockResolvedValue(undefined);
      (documentRepository.saveWithChunksAndEmbeddings as jest.Mock).mockResolvedValue(mockDocument);

      // Act
      const result = await useCase.execute(mockFile, 'test-user', mockOptions);

      // Assert
      expect(result).toBeDefined();
      expect(documentRepository.saveWithChunksAndEmbeddings).toHaveBeenCalled();
      expect(documentRepository.save).not.toHaveBeenCalled();
      expect(storageAdapter.softDeleteDocument).not.toHaveBeenCalled();
      
      const callArgs = (documentRepository.saveWithChunksAndEmbeddings as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toHaveLength(2); // 2 chunks
      expect(callArgs[2]).toEqual(mockPreGeneratedEmbeddings);
      expect(callArgs[3]).toBe(mockOptions.extractedText);
    });

    it('should rollback storage if atomic transaction fails', async () => {
      // Arrange
      const fileName = 'test-123.pdf';
      storageAdapter.uploadDocument.mockResolvedValue({
        fileName: fileName,
        url: 'http://test.com/test.pdf',
      } as any);
      documentRepository.findByFileHash.mockResolvedValue(undefined);
      (documentRepository.saveWithChunksAndEmbeddings as jest.Mock).mockRejectedValue(
        new Error('Transaction failed'),
      );
      (storageAdapter.softDeleteDocument as jest.Mock).mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        useCase.execute(mockFile, 'test-user', mockOptions),
      ).rejects.toThrow(DocumentNotSavedError);
      
      expect(documentRepository.saveWithChunksAndEmbeddings).toHaveBeenCalled();
      expect(storageAdapter.softDeleteDocument).toHaveBeenCalledWith(fileName);
    });

    it('should throw StorageRollbackError if both transaction and rollback fail', async () => {
      // Arrange
      const fileName = 'test-456.pdf';
      storageAdapter.uploadDocument.mockResolvedValue({
        fileName: fileName,
        url: 'http://test.com/test.pdf',
      } as any);
      documentRepository.findByFileHash.mockResolvedValue(undefined);
      (documentRepository.saveWithChunksAndEmbeddings as jest.Mock).mockRejectedValue(
        new Error('Transaction failed'),
      );
      (storageAdapter.softDeleteDocument as jest.Mock).mockRejectedValue(
        new Error('Rollback failed'),
      );

      // Act & Assert
      await expect(
        useCase.execute(mockFile, 'test-user', mockOptions),
      ).rejects.toThrow(StorageRollbackError);
      
      expect(documentRepository.saveWithChunksAndEmbeddings).toHaveBeenCalled();
      expect(storageAdapter.softDeleteDocument).toHaveBeenCalledWith(fileName);
    });

    it('should not have partial data in database after transaction failure', async () => {
      // Arrange
      storageAdapter.uploadDocument.mockResolvedValue({
        fileName: 'test.pdf',
        url: 'http://test.com/test.pdf',
      } as any);
      documentRepository.findByFileHash.mockResolvedValue(undefined);
      (documentRepository.saveWithChunksAndEmbeddings as jest.Mock).mockRejectedValue(
        new Error('Partial save error'),
      );
      (storageAdapter.softDeleteDocument as jest.Mock).mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        useCase.execute(mockFile, 'test-user', mockOptions),
      ).rejects.toThrow(DocumentNotSavedError);
      
      // Verify that saveWithChunksAndEmbeddings was called only once (transaction)
      // and no individual save operations were attempted
      expect(documentRepository.saveWithChunksAndEmbeddings).toHaveBeenCalledTimes(1);
      expect(documentRepository.save).not.toHaveBeenCalled();
    });
  });
});