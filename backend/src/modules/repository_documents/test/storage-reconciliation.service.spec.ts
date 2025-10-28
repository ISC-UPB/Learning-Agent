import { Test, TestingModule } from '@nestjs/testing';
import { StorageReconciliationService } from '../infrastructure/services/storage-reconciliation.service';
import { DocumentStoragePort } from '../domain/ports/document-storage.port';
import { DocumentRepositoryPort } from '../domain/ports/document-repository.port';
import { DocumentChunkRepositoryPort } from '../domain/ports/document-chunk-repository.port';
import { Document, DocumentStatus } from '../domain/entities/document.entity';
import { Logger } from '@nestjs/common';

describe('StorageReconciliationService', () => {
  let service: StorageReconciliationService;
  let storageAdapter: jest.Mocked<DocumentStoragePort>;
  let documentRepository: jest.Mocked<DocumentRepositoryPort>;
  let chunkRepository: jest.Mocked<DocumentChunkRepositoryPort>;

  const mockProcessedDocument = {
    id: 'processed-id',
    fileName: 'processed.pdf',
    status: DocumentStatus.PROCESSED,
    s3Key: 'processed.pdf',
  } as Document;

  const mockDeletedDocument = {
    id: 'deleted-id',
    fileName: 'deleted.pdf',
    status: DocumentStatus.DELETED,
    s3Key: 'deleted.pdf',
  } as Document;

  beforeEach(async () => {
    // Mock implementations
    storageAdapter = {
      exists: jest.fn(),
      deleteFile: jest.fn(),
    } as any;

    documentRepository = {
      findByStatus: jest.fn(),
      updateStatus: jest.fn(),
    } as any;

    chunkRepository = {
      softDeleteByDocumentId: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageReconciliationService,
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
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StorageReconciliationService>(
      StorageReconciliationService,
    );
  });

  it('should handle missing storage files', async () => {
    // Arrange
    documentRepository.findByStatus
      .mockResolvedValue([mockProcessedDocument]);
    storageAdapter.exists.mockResolvedValue(false);
    documentRepository.updateStatus.mockResolvedValue(mockProcessedDocument);
    chunkRepository.softDeleteByDocumentId.mockResolvedValue();

    // Act
    await service.reconcileStorageAndDatabase();

    // Assert
    expect(documentRepository.updateStatus).toHaveBeenCalledWith(
      mockProcessedDocument.id,
      DocumentStatus.ERROR,
    );
    expect(chunkRepository.softDeleteByDocumentId).toHaveBeenCalledWith(
      mockProcessedDocument.id,
    );
  });

  it('should handle orphaned storage files', async () => {
    // Arrange
    documentRepository.findByStatus
      .mockResolvedValue([mockDeletedDocument]);
    storageAdapter.exists.mockResolvedValue(true);

    // Act
    await service.reconcileStorageAndDatabase();

    // Assert
    expect(storageAdapter.deleteFile).toHaveBeenCalledWith(
      mockDeletedDocument.fileName,
    );
  });

  it('should handle storage check errors gracefully', async () => {
    // Arrange
    documentRepository.findByStatus
      .mockResolvedValue([mockProcessedDocument]);
    storageAdapter.exists.mockRejectedValue(new Error('Storage error'));

    // Act
    await service.reconcileStorageAndDatabase();

    // Assert
    expect(documentRepository.updateStatus).not.toHaveBeenCalled();
    expect(chunkRepository.softDeleteByDocumentId).not.toHaveBeenCalled();
  });

  it('should handle database update errors gracefully', async () => {
    // Arrange
    documentRepository.findByStatus
      .mockResolvedValue([mockProcessedDocument]);
    storageAdapter.exists.mockResolvedValue(false);
    documentRepository.updateStatus.mockRejectedValue(
      new Error('Database error'),
    );

    // Act
    await service.reconcileStorageAndDatabase();

    // Assert
    expect(chunkRepository.softDeleteByDocumentId).not.toHaveBeenCalled();
  });

  it('should continue reconciliation after individual document error', async () => {
    // Arrange
    const mockDocuments = [mockProcessedDocument, mockDeletedDocument];
    documentRepository.findByStatus.mockResolvedValue(mockDocuments);
    storageAdapter.exists
      .mockRejectedValueOnce(new Error('Error for first doc'))
      .mockResolvedValueOnce(true);

    // Act
    await service.reconcileStorageAndDatabase();

    // Assert
    expect(storageAdapter.exists).toHaveBeenCalledTimes(2);
    expect(storageAdapter.deleteFile).toHaveBeenCalledWith(
      mockDeletedDocument.fileName,
    );
  });
});