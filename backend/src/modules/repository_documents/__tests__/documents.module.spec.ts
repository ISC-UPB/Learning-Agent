import { Test } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { PROCESSING_JOB_REPOSITORY_PORT } from '../tokens';
import { PrismaProcessingJobRepositoryAdapter } from '../infrastructure/persistence/prisma-processing-job-repository.adapter';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: PROCESSING_JOB_REPOSITORY_PORT,
      useClass: PrismaProcessingJobRepositoryAdapter,
    },
  ],
  exports: [PROCESSING_JOB_REPOSITORY_PORT],
})
class TestModule {}

describe('ProcessingJobRepository Registration', () => {
  it('should properly provide and export ProcessingJobRepository', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    const processingJobRepo = moduleRef.get(PROCESSING_JOB_REPOSITORY_PORT);
    
    expect(processingJobRepo).toBeDefined();
    expect(processingJobRepo).toBeInstanceOf(PrismaProcessingJobRepositoryAdapter);
  });
});