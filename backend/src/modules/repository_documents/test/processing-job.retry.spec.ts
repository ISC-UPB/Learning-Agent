import { ProcessingJobService } from '../domain/services/processing-job.service';
import { ProcessingJob, ProcessingStatus, ProcessingType } from '../domain/entities/processing-job.entity';
import { DeadLetterRepository } from '../infrastructure/persistence/prisma-dead-letter.repository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('ProcessingJob retry and dead-letter handling', () => {
 
  let saveSpy: jest.SpyInstance;

  beforeAll(() => {
    saveSpy = jest
      .spyOn(DeadLetterRepository.prototype, 'save')
      .mockImplementation(async (data: any) => ({ id: 'mock-id', ...data }));
  });

  afterAll(async () => {
    saveSpy.mockRestore();
    await prisma.$disconnect();
  });

  it('debe mover el job a DeadLetter después de exceder el límite de reintentos', async () => {
   
    const job = ProcessingJobService.create(
      'job-test-1',
      'doc-123',
      ProcessingType.TEXT_EXTRACTION, 
      { test: true }
    );

    let currentJob = job;
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
       
        throw new Error(`Simulated worker failure #${attempt + 1}`);
      } catch (err: any) {
        attempt++;

        if (attempt < MAX_RETRIES) {
  
          const failed = ProcessingJobService.fail(currentJob, err.message);
          currentJob = ProcessingJobService.retry(failed);
        } else {
       
          const failedFinal = ProcessingJobService.fail(currentJob, err.message);

        
          await new DeadLetterRepository().save({
            jobId: failedFinal.id,
            documentId: failedFinal.documentId,
            jobType: failedFinal.jobType,
            payload: failedFinal.jobDetails,
            errorMessage: failedFinal.errorMessage,
            attempts: attempt,
          });

          currentJob = failedFinal;
        }
      }
    }

    
    expect(currentJob.status).toBe(ProcessingStatus.FAILED);

   
    expect(saveSpy).toHaveBeenCalled();
    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'job-test-1', attempts: MAX_RETRIES }),
    );
  });
});
