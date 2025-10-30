import { Test } from '@nestjs/testing';
// Mock PrismaService
class MockPrismaService {
  user = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  };

  document = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  };

  documentChunk = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  };

  processingJob = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
  };
}
// Use MockPrismaService instead of actual PrismaService
const PrismaService = MockPrismaService;
import { PrismaProcessingJobRepositoryAdapter } from '../prisma-processing-job-repository.adapter';
import { ProcessingJob, ProcessingType, ProcessingStatus } from '../../../domain/entities/processing-job.entity';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('PrismaProcessingJobRepositoryAdapter', () => {
  let prismaService: MockPrismaService;
  let repository: PrismaProcessingJobRepositoryAdapter;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        PrismaProcessingJobRepositoryAdapter,
      ],
    }).compile();

    prismaService = moduleRef.get(PrismaService);
    repository = moduleRef.get<PrismaProcessingJobRepositoryAdapter>(PrismaProcessingJobRepositoryAdapter);

    // Limpiar la base de datos antes de cada test
    await prismaService.processingJob.deleteMany();
    await prismaService.documentChunk.deleteMany();
    await prismaService.document.deleteMany();
    await prismaService.user.deleteMany();

    // Crear usuario y documento de prueba
    const testUser = await prismaService.user.create({
      data: {
        id: 'test-user',
        name: 'Test',
        lastname: 'User',
        email: 'test@example.com',
        password: 'testpass'
      }
    });

    await prismaService.document.create({
      data: {
        id: 'test-doc-1',
        originalName: 'test1.txt',
        storedName: 'test1-stored.txt',
        s3Key: 'test1-key',
        size: 1000,
        contentType: 'text/plain',
        fileHash: 'hash1',
        uploadedBy: testUser.id
      }
    });
  });

  it('should save and retrieve a processing job', async () => {
    // Arrange
    const job = ProcessingJob.create(
      'job-1',
      'test-doc-1',
      ProcessingType.CHUNKING,
      { chunkSize: 1000 }
    );

    // Act
    const savedJob = await repository.save(job);
    const retrievedJob = await repository.findById('job-1');

    // Assert
    expect(retrievedJob).toBeDefined();
    expect(retrievedJob?.id).toBe('job-1');
    expect(retrievedJob?.documentId).toBe('test-doc-1');
    expect(retrievedJob?.jobType).toBe(ProcessingType.CHUNKING);
    expect(retrievedJob?.status).toBe(ProcessingStatus.PENDING);
    expect(retrievedJob?.jobDetails).toEqual({ chunkSize: 1000 });
  });

  it('should update an existing job', async () => {
    // Arrange
    const job = ProcessingJob.create(
      'job-2',
      'test-doc-1',
      ProcessingType.CHUNKING,
      {}
    );

    // Act
    await repository.save(job);
    const updatedJob = await repository.save(job.start());
    const retrievedJob = await repository.findById('job-2');

    // Assert
    expect(retrievedJob?.status).toBe(ProcessingStatus.RUNNING);
    expect(retrievedJob?.startedAt).toBeDefined();
  });

  it('should find jobs by document and type', async () => {
    // Arrange
    const job1 = ProcessingJob.create(
      'job-3',
      'test-doc-1',
      ProcessingType.CHUNKING,
      {}
    );
    const job2 = ProcessingJob.create(
      'job-4',
      'test-doc-1',
      ProcessingType.CHUNKING,
      {}
    );
    const job3 = ProcessingJob.create(
      'job-5',
      'test-doc-1',
      ProcessingType.EMBEDDING_GENERATION,
      {}
    );

    await repository.save(job1);
    await repository.save(job2);
    await repository.save(job3);

    // Act
    const chunkingJobs = await repository.findByDocumentAndType(
      'test-doc-1',
      ProcessingType.CHUNKING
    );

    // Assert
    expect(chunkingJobs).toHaveLength(2);
    expect(chunkingJobs.map(j => j.id)).toContain('job-3');
    expect(chunkingJobs.map(j => j.id)).toContain('job-4');
  });

  it('should find active jobs by document', async () => {
    // Arrange
    const job1 = ProcessingJob.create(
      'job-6',
      'test-doc-1',
      ProcessingType.CHUNKING,
      {}
    );
    const job2 = ProcessingJob.create(
      'job-7',
      'test-doc-1',
      ProcessingType.CHUNKING,
      {}
    ).start();
    const job3 = ProcessingJob.create(
      'job-8',
      'test-doc-1',
      ProcessingType.CHUNKING,
      {}
    ).complete();

    await repository.save(job1);
    await repository.save(job2);
    await repository.save(job3);

    // Act
    const activeJobs = await repository.findActiveByDocument('test-doc-1');

    // Assert
    expect(activeJobs).toHaveLength(2);
    expect(activeJobs.map(j => j.status)).toContain(ProcessingStatus.PENDING);
    expect(activeJobs.map(j => j.status)).toContain(ProcessingStatus.RUNNING);
  });

  it('should mark stale jobs as failed', async () => {
    // Arrange
    const oldDate = new Date();
    oldDate.setHours(oldDate.getHours() - 1); // 1 hora atrás

    const job1 = new ProcessingJob(
      'job-9',
      'test-doc-1',
      ProcessingType.CHUNKING,
      ProcessingStatus.RUNNING,
      50,
      undefined,
      undefined,
      undefined,
      new Date(),
      undefined,
      oldDate
    );

    const job2 = ProcessingJob.create(
      'job-10',
      'test-doc-1',
      ProcessingType.CHUNKING,
      {}
    );

    await repository.save(job1);
    await repository.save(job2);

    const cutoffDate = new Date();
    cutoffDate.setMinutes(cutoffDate.getMinutes() - 30); // 30 minutos atrás

    // Act
    const updatedCount = await repository.markStaleJobsAsFailed(cutoffDate);
    const job1After = await repository.findById('job-9');
    const job2After = await repository.findById('job-10');

    // Assert
    expect(updatedCount).toBe(1);
    expect(job1After?.status).toBe(ProcessingStatus.FAILED);
    expect(job2After?.status).toBe(ProcessingStatus.PENDING);
  });
});