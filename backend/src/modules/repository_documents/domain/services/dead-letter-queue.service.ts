import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ProcessingJob } from '../entities/processing-job.entity';
import { ProcessingStatus } from '../entities/processing-job.entity';
import type { ProcessingJobRepositoryPort } from '../ports/processing-job-repository.port';
import { PROCESSING_JOB_REPOSITORY_PORT } from '../../tokens';
import { RetryService } from './retry.service';

@Injectable()
export class DeadLetterQueueService {
  private static instance: DeadLetterQueueService;
  private readonly logger = new Logger(DeadLetterQueueService.name);
  private readonly maxRetries: number = 3;

  constructor(
    @Inject(PROCESSING_JOB_REPOSITORY_PORT)
    private readonly jobRepository: ProcessingJobRepositoryPort,
    private readonly retryService: RetryService,
  ) {
    DeadLetterQueueService.instance = this;
  }

  static getInstance(): DeadLetterQueueService {
    if (!DeadLetterQueueService.instance) {
      throw new Error('[FATAL] DeadLetterQueueService not initialized. Ensure it is properly injected in documents.module.ts');
    }
    return DeadLetterQueueService.instance;
  }

  /**
   * Maneja un job fallido, determinando si debe ir a DLQ o reintentarse
   */
  async handleFailedJob(job: ProcessingJob, error: Error): Promise<ProcessingJob> {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);

    if (!this.retryService.shouldRetry(job.attemptCount)) {
      this.logger.warn(`Job ${job.id} exceeded max retries (${this.maxRetries}), moving to DLQ`);
      return await this.moveToDeadLetterQueue(job, error.message);
    }

    // Aplicar delay con backoff exponencial antes de reintentar
    await this.retryService.delay(job.attemptCount);
    return await this.retryJob(job);
  }

  /**
   * Mueve un job a la cola de dead letter
   */
  private async moveToDeadLetterQueue(job: ProcessingJob, errorMessage: string): Promise<ProcessingJob> {
    const updatedJob = await this.jobRepository.updateStatus(
      job.id,
      ProcessingStatus.DEAD_LETTER,
      errorMessage,
    );
    
    if (!updatedJob) {
      throw new Error(`Failed to move job ${job.id} to dead letter queue`);
    }
    
    return updatedJob;
  }

  /**
   * Reintenta un job fallido
   */
  private async retryJob(job: ProcessingJob): Promise<ProcessingJob> {
    this.logger.log(`Retrying job ${job.id} (attempt ${job.attemptCount + 1})`);
    const updatedJob = await this.jobRepository.updateStatus(
      job.id,
      ProcessingStatus.RETRYING,
    );
    
    if (!updatedJob) {
      throw new Error(`Failed to retry job ${job.id}`);
    }
    
    return updatedJob;
  }
}