import { Module } from '@nestjs/common';
import { ProcessingJobService } from './domain/services/processing-job.service';
import { PrismaProcessingJobRepository } from './infrastructure/persistence/prisma-processing-job.repository';

@Module({
  providers: [
    ProcessingJobService,
    {
      provide: 'ProcessingJobRepositoryPort',
      useClass: PrismaProcessingJobRepository,
    },
  ],
  exports: [ProcessingJobService],
})
export class ProcessingJobModule {}