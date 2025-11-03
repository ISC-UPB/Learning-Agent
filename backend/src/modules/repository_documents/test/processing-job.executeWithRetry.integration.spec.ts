import { Test } from '@nestjs/testing';
import { PrismaModule } from '../../../../core/prisma/prisma.module';
import { DocumentsModule } from '../../documents.module';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { DeadLetterRepository } from '../infrastructure/persistence/prisma-dead-letter.repository';
import { ProcessingJobService } from '../domain/services/processing-job.service';
import { ProcessingType } from '../domain/entities/processing-job.entity';
import * as retryUtils from '../infrastructure/services/retry.utils';

describe('ProcessingJobService.executeWithRetry - integration', () => {
  let moduleRef: any;
  let prisma: PrismaService;
  let deadLetterRepo: DeadLetterRepository;

  beforeAll(async () => {
    // speed up retries
    jest.spyOn(retryUtils, 'getBackoffDelay').mockReturnValue(0);

    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, DocumentsModule],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    deadLetterRepo = moduleRef.get(DeadLetterRepository);

    // ensure clean slate
    await prisma.deadLetter.deleteMany();

    ProcessingJobService.setDeadLetterRepo(deadLetterRepo);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await moduleRef.close();
  });

  it('creates a dead-letter row after failing max attempts', async () => {
    const jobId = 'job-int-1';
    const job = ProcessingJobService.create(
      jobId,
      'doc-int-1',
      ProcessingType.TEXT_EXTRACTION,
      { testing: true },
    );

    const handler = async () => {
      throw new Error('integration-handler-failure');
    };

    await ProcessingJobService.executeWithRetry(job, handler);

    const rows = await prisma.deadLetter.findMany({ where: { jobId } });
    expect(rows.length).toBe(1);
    expect(rows[0].jobId).toBe(jobId);
  });
});
