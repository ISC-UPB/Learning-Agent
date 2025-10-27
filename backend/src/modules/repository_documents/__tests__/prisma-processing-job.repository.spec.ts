import { PrismaProcessingJobRepositoryAdapter } from '../infrastructure/persistence/prisma-processing-job-repository.adapter';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ProcessingJob, ProcessingStatus, ProcessingType } from '../domain/entities/processing-job.entity';

describe('PrismaProcessingJobRepositoryAdapter (idempotencia)', () => {
  let prismaMock: any;
  let repository: PrismaProcessingJobRepositoryAdapter;

  beforeEach(() => {
    prismaMock = {
      processingJob: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
    };

    repository = new PrismaProcessingJobRepositoryAdapter(prismaMock as PrismaService);
  });

  it('crea un job nuevo correctamente', async () => {
    const job = new ProcessingJob(
      'job1',
      'doc1',
      ProcessingType.CHUNKING, 
      ProcessingStatus.PENDING,
      0,
      undefined,
      {},
      {},
      undefined,
      undefined,
      new Date(),
    );

    prismaMock.processingJob.create.mockResolvedValue({
      id: job.id,
      documentId: job.documentId,
      jobType: job.jobType,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
    });

    const result = await repository.create(job);

    expect(result.id).toBe('job1');
    expect(prismaMock.processingJob.create).toHaveBeenCalled();
  });

  it('detecta duplicado (P2002) y retorna existente', async () => {
    const job = new ProcessingJob(
      'job2',
      'doc1',
      ProcessingType.CHUNKING, 
      ProcessingStatus.PENDING,
      0,
      undefined,
      {},
      {},
      undefined,
      undefined,
      new Date(),
    );

    prismaMock.processingJob.create.mockRejectedValue({ code: 'P2002' });
    prismaMock.processingJob.findUnique.mockResolvedValue({
      id: 'existing-job',
      documentId: job.documentId,
      jobType: job.jobType,
      status: ProcessingStatus.PENDING,
      progress: 0,
      createdAt: new Date(),
    });

    const result = await repository.create(job);

    expect(result.id).toBe('existing-job');
    expect(prismaMock.processingJob.findUnique).toHaveBeenCalled();
  });

  it(' actualiza el estado del job', async () => {
    const job = new ProcessingJob(
      'job3',
      'doc1',
      ProcessingType.CHUNKING,
      ProcessingStatus.RUNNING,
      50,
      undefined,
      {},
      {},
      new Date(),
      undefined,
      new Date(),
    );

    prismaMock.processingJob.update.mockResolvedValue({
      id: job.id,
      documentId: job.documentId,
      jobType: job.jobType,
      status: ProcessingStatus.COMPLETED,
      progress: 100,
      createdAt: job.createdAt,
    });

    const result = await repository.update(job);

    expect(result.status).toBe(ProcessingStatus.COMPLETED);
  });

  it(' elimina un job por id', async () => {
    prismaMock.processingJob.delete.mockResolvedValue({});

    await repository.delete('job1');

    expect(prismaMock.processingJob.delete).toHaveBeenCalledWith({
      where: { id: 'job1' },
    });
  });
});
