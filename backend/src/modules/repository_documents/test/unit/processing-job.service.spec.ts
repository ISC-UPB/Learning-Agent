import { Test, TestingModule } from '@nestjs/testing';
import { ProcessingJobService } from '../../domain/services/processing-job.service';
import { ProcessingJobRepositoryPort } from '../../domain/ports/processing-job-repository.port';
import { ProcessingJob, ProcessingStatus, ProcessingType } from '../../domain/entities/processing-job.entity';
import { describe, beforeEach, it, expect } from '@jest/globals';

jest.mock('../../domain/ports/processing-job-repository.port');

describe('ProcessingJobService', () => {
  let service: ProcessingJobService;
  let mockJobRepository: jest.Mocked<ProcessingJobRepositoryPort>;

  beforeEach(async () => {
    mockJobRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findActiveByDocument: jest.fn(),
      markStaleJobsAsFailed: jest.fn(),
      findDuplicateJobs: jest.fn(),
      findLastSuccessfulJob: jest.fn(),
      findRetryableJobs: jest.fn(),
      updateProgress: jest.fn(),
    } as jest.Mocked<ProcessingJobRepositoryPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessingJobService,
        {
          provide: 'ProcessingJobRepositoryPort',
          useValue: mockJobRepository,
        },
      ],
    }).compile();

    service = module.get<ProcessingJobService>(ProcessingJobService);
  });

  describe('createJob', () => {
    it('debe evitar duplicados basados en hash de contenido', async () => {
      const contentHash = 'test-hash-123';
      const documentId = 'doc1';
      const jobType = ProcessingType.TEXT_EXTRACTION;

      mockJobRepository.findDuplicateJobs.mockResolvedValue([
        new ProcessingJob(
          'existing-job',
          documentId,
          jobType,
          ProcessingStatus.COMPLETED,
          100,
          undefined,
          { contentHash },
        ),
      ]);

      const result = await service.createJobWithDeduplication(documentId, jobType, { contentHash });

      expect(result.status).toBe(ProcessingStatus.COMPLETED);
      expect(mockJobRepository.save).not.toHaveBeenCalled();
    });

    it('debe permitir nuevo job si no hay duplicados', async () => {
      const contentHash = 'test-hash-123';
      const documentId = 'doc1';
      const jobType = ProcessingType.TEXT_EXTRACTION;

      mockJobRepository.findDuplicateJobs.mockResolvedValue([]);
      mockJobRepository.save.mockImplementation((job) => Promise.resolve(job));

      const result = await service.createJobWithDeduplication(documentId, jobType, { contentHash });

      expect(result.status).toBe(ProcessingStatus.PENDING);
      expect(result.documentId).toBe(documentId);
      expect(mockJobRepository.save).toHaveBeenCalled();
    });
  });

  describe('retryJob', () => {
    it('debe retornar null si el job no existe', async () => {
      mockJobRepository.findById.mockResolvedValue(null);

      const result = await service.retryJob('nonexistent');

      expect(result).toBeNull();
      expect(mockJobRepository.save).not.toHaveBeenCalled();
    });

    it('debe retornar null si el job no puede ser reintentado', async () => {
      const job = new ProcessingJob(
        'test',
        'doc1',
        ProcessingType.TEXT_EXTRACTION,
        ProcessingStatus.COMPLETED,
      );

      mockJobRepository.findById.mockResolvedValue(job);

      const result = await service.retryJob('test');

      expect(result).toBeNull();
      expect(mockJobRepository.save).not.toHaveBeenCalled();
    });

    it('debe crear un nuevo job de reintento si es posible', async () => {
      const job = new ProcessingJob(
        'test',
        'doc1',
        ProcessingType.TEXT_EXTRACTION,
        ProcessingStatus.FAILED,
        50,
        'Error test',
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        undefined,
        0,
      );

      mockJobRepository.findById.mockResolvedValue(job);
      mockJobRepository.save.mockImplementation((job) => Promise.resolve(job));

      const result = await service.retryJob('test');

      expect(result).not.toBeNull();
      expect(result?.status).toBe(ProcessingStatus.RETRYING);
      expect(result?.retryCount).toBe(1);
      expect(mockJobRepository.save).toHaveBeenCalled();
    });
  });

  describe('markStaleJobs', () => {
    it('debe marcar jobs estancados como fallidos', async () => {
      const cutoffDate = new Date();
      mockJobRepository.markStaleJobsAsFailed.mockResolvedValue(2);

      const count = await service.markStaleJobs(cutoffDate);

      expect(count).toBe(2);
      expect(mockJobRepository.markStaleJobsAsFailed).toHaveBeenCalledWith(cutoffDate);
    });
  });
});