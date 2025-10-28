import { Test, TestingModule } from '@nestjs/testing';
import { DeleteDocumentUseCase } from '../application/commands/delete-document.usecase';
import { DocumentStoragePort } from '../domain/ports/document-storage.port';
import { DocumentRepositoryPort } from '../domain/ports/document-repository.port';
import { DocumentChunkRepositoryPort } from '../domain/ports/document-chunk-repository.port';
import { Document, DocumentStatus } from '../domain/entities/document.entity';

describe('DeleteDocumentUseCase', () => {
  let useCase: DeleteDocumentUseCase;
  let storageAdapter: jest.Mocked<DocumentStoragePort>;
  let documentRepository: jest.Mocked<DocumentRepositoryPort>;
  let chunkRepository: jest.Mocked<DocumentChunkRepositoryPort>;

  const mockDocument = {
    id: 'test-id',
    fileName: 'test.pdf',
    originalName: 'test.pdf',
    status: DocumentStatus.PROCESSED,
  } as Document;

  beforeEach(async () => {
    // Mock implementations
    storageAdapter = {
      documentExists: jest.fn(),
      softDeleteDocument: jest.fn(),
      deleteFile: jest.fn(),
    } as any;

    documentRepository = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
      restoreStatus: jest.fn(),
    } as any;

    chunkRepository = {
      softDeleteByDocumentId: jest.fn(),
      restoreByDocumentId: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteDocumentUseCase,
        {
          provide: 'DocumentStoragePort',
          useValue: storageAdapter,
        },
        {
          provide: 'DocumentRepositoryPort',
          useValue: documentRepository,
        },
        {
          provide: 'DocumentChunkRepositoryPort',
          useValue: chunkRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteDocumentUseCase>(DeleteDocumentUseCase);
  });

  it('should delete document successfully', async () => {
    // Arrange
    documentRepository.findById.mockResolvedValue(mockDocument);
    storageAdapter.documentExists.mockResolvedValue(true);
    documentRepository.updateStatus.mockResolvedValue(mockDocument);
    storageAdapter.softDeleteDocument.mockResolvedValue();
    chunkRepository.softDeleteByDocumentId.mockResolvedValue();

    // Act
    const result = await useCase.execute('test-id');

    // Assert
    expect(result.success).toBe(true);
    expect(documentRepository.updateStatus).toHaveBeenCalledWith(
      'test-id',
      DocumentStatus.DELETED,
    );
    expect(chunkRepository.softDeleteByDocumentId).toHaveBeenCalledWith('test-id');
    expect(storageAdapter.softDeleteDocument).toHaveBeenCalledWith(mockDocument.fileName);
    expect(documentRepository.restoreStatus).not.toHaveBeenCalled();
    expect(chunkRepository.restoreByDocumentId).not.toHaveBeenCalled();
  });

  it('should rollback database changes if storage delete fails', async () => {
    // Arrange
    documentRepository.findById.mockResolvedValue(mockDocument);
    storageAdapter.documentExists.mockResolvedValue(true);
    documentRepository.updateStatus.mockResolvedValue(mockDocument);
    chunkRepository.softDeleteByDocumentId.mockResolvedValue();
    storageAdapter.softDeleteDocument.mockRejectedValue(new Error('Storage error'));
    documentRepository.restoreStatus.mockResolvedValue(mockDocument);
    chunkRepository.restoreByDocumentId.mockResolvedValue();

    // Act
    const result = await useCase.execute('test-id');

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(documentRepository.updateStatus).toHaveBeenCalledWith(
      'test-id',
      DocumentStatus.DELETED,
    );
    expect(documentRepository.restoreStatus).toHaveBeenCalledWith(
      'test-id',
      DocumentStatus.PROCESSED,
    );
    expect(chunkRepository.restoreByDocumentId).toHaveBeenCalledWith('test-id');
  });

  it('should handle document not found', async () => {
    // Arrange
    documentRepository.findById.mockResolvedValue(undefined);

    // Act
    const result = await useCase.execute('test-id');

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('DOCUMENT_NOT_FOUND');
    expect(storageAdapter.softDeleteDocument).not.toHaveBeenCalled();
    expect(documentRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('should handle file not found in storage', async () => {
    // Arrange
    documentRepository.findById.mockResolvedValue(mockDocument);
    storageAdapter.documentExists.mockResolvedValue(false);

    // Act
    const result = await useCase.execute('test-id');

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('DOCUMENT_NOT_FOUND');
    expect(storageAdapter.softDeleteDocument).not.toHaveBeenCalled();
    expect(documentRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('should handle rollback failure', async () => {
    // Arrange
    documentRepository.findById.mockResolvedValue(mockDocument);
    storageAdapter.documentExists.mockResolvedValue(true);
    documentRepository.updateStatus.mockResolvedValue(mockDocument);
    chunkRepository.softDeleteByDocumentId.mockResolvedValue();
    storageAdapter.softDeleteDocument.mockRejectedValue(new Error('Storage error'));
    documentRepository.restoreStatus.mockRejectedValue(new Error('Rollback failed'));

    // Act & Assert
    await expect(useCase.execute('test-id')).rejects.toThrow('Delete failed and rollback failed');
  });
});