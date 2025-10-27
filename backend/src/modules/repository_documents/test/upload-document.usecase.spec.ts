import { Test, TestingModule } from '@nestjs/testing';
import { UploadDocumentUseCase } from '../application/commands/upload-document.usecase';
import { DocumentStoragePort } from '../domain/ports/document-storage.port';
import { DocumentRepositoryPort } from '../domain/ports/document-repository.port';
import { Document, DocumentStatus } from '../domain/entities/document.entity';
import { DocumentChunkingService } from '../domain/services/document-chunking.service';
import { BadRequestException } from '@nestjs/common';

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
});