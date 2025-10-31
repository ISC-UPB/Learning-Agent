import {
  ProcessingJob,
  ProcessingType,
  ProcessingStatus,
} from '../entities/processing-job.entity';

import { DeadLetterRepository } from '../../infrastructure/persistence/prisma-dead-letter.repository';
import { RETRY_CONFIG } from '../../infrastructure/config/retry.config';
import { getBackoffDelay } from '../../infrastructure/services/retry.utils';

/**
 * Service to manage job lifecycle and retry/dead-letter logic.
 */
export class ProcessingJobService {
  private static deadLetterRepo = new DeadLetterRepository();

  /**
   * Creates a new processing job
   */
  static create(
    id: string,
    documentId: string,
    jobType: ProcessingType,
    jobDetails?: Record<string, any>,
  ): ProcessingJob {
    return new ProcessingJob(
      id,
      documentId,
      jobType,
      ProcessingStatus.PENDING,
      0,
      undefined,
      jobDetails,
    );
  }

  /**
   * Marks the job as started
   */
  static start(job: ProcessingJob): ProcessingJob {
    if (
      job.status !== ProcessingStatus.PENDING &&
      job.status !== ProcessingStatus.RETRYING
    ) {
      throw new Error(`Cannot start job in status: ${job.status}`);
    }

    return new ProcessingJob(
      job.id,
      job.documentId,
      job.jobType,
      ProcessingStatus.RUNNING,
      job.progress,
      job.errorMessage,
      job.jobDetails,
      job.result,
      new Date(),
      job.completedAt,
      job.createdAt,
    );
  }

  /**
   * Updates the job progress
   */
  static updateProgress(job: ProcessingJob, progress: number): ProcessingJob {
    if (!this.isRunning(job)) {
      throw new Error(
        `Cannot update progress for job in status: ${job.status}`,
      );
    }

    const validProgress = Math.max(0, Math.min(100, progress));

    return new ProcessingJob(
      job.id,
      job.documentId,
      job.jobType,
      job.status,
      validProgress,
      job.errorMessage,
      job.jobDetails,
      job.result,
      job.startedAt,
      job.completedAt,
      job.createdAt,
    );
  }

  /**
   * Marks the job as completed successfully
   */
  static complete(
    job: ProcessingJob,
    result?: Record<string, any>,
  ): ProcessingJob {
    if (!this.isRunning(job)) {
      throw new Error(`Cannot complete job in status: ${job.status}`);
    }

    return new ProcessingJob(
      job.id,
      job.documentId,
      job.jobType,
      ProcessingStatus.COMPLETED,
      100,
      job.errorMessage,
      job.jobDetails,
      result,
      job.startedAt,
      new Date(),
      job.createdAt,
    );
  }

  /**
   * Marks the job as failed
   */
  static fail(job: ProcessingJob, errorMessage: string): ProcessingJob {
    if (this.isTerminal(job)) {
      throw new Error(`Cannot fail job in terminal status: ${job.status}`);
    }

    return new ProcessingJob(
      job.id,
      job.documentId,
      job.jobType,
      ProcessingStatus.FAILED,
      job.progress,
      errorMessage,
      job.jobDetails,
      job.result,
      job.startedAt,
      new Date(),
      job.createdAt,
    );
  }

  /**
   * Marks the job as cancelled
   */
  static cancel(job: ProcessingJob): ProcessingJob {
    if (this.isTerminal(job)) {
      throw new Error(`Cannot cancel job in terminal status: ${job.status}`);
    }

    return new ProcessingJob(
      job.id,
      job.documentId,
      job.jobType,
      ProcessingStatus.CANCELLED,
      job.progress,
      job.errorMessage,
      job.jobDetails,
      job.result,
      job.startedAt,
      new Date(),
      job.createdAt,
    );
  }

  /**
   * Marks the job for retry
   */
  static retry(job: ProcessingJob): ProcessingJob {
    if (!this.canRetry(job)) {
      throw new Error(`Cannot retry job in status: ${job.status}`);
    }

    return new ProcessingJob(
      job.id,
      job.documentId,
      job.jobType,
      ProcessingStatus.RETRYING,
      0,
      undefined,
      job.jobDetails,
      undefined,
      undefined,
      undefined,
      job.createdAt,
    );
  }

  /**
   * Executes a job with retry and backoff policy
   */
  static async executeWithRetry(
    job: ProcessingJob,
    handler: (job: ProcessingJob) => Promise<void>,
  ): Promise<void> {
    let attempt = 0;

    while (attempt < RETRY_CONFIG.maxAttempts) {
      try {
        console.log(`[JOB] Starting job ${job.id}, attempt ${attempt + 1}`);
        const started = this.start(job);
        await handler(started);

        const completed = this.complete(started);
        console.log(`[JOB] Job ${job.id} completed successfully`);
        return;
      } catch (error) {
        attempt++;
        const delay = getBackoffDelay(attempt);
        console.warn(
          `[JOB] Job ${job.id} failed (attempt ${attempt}): ${error}. Retrying in ${delay.toFixed(
            0,
          )}ms`,
        );

        if (attempt >= RETRY_CONFIG.maxAttempts) {
          console.error(`[JOB] Job ${job.id} exceeded retry limit. Moving to dead-letter.`);
          await this.deadLetterRepo.save({
            jobId: job.id,
            documentId: job.documentId,
            jobType: job.jobType,
            errorMessage: (error as Error).message,
            attempts: attempt,
            payload: job.jobDetails,
          });
          return;
        }

        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  /**
   * Checks if the job is in a terminal state
   */
  static isTerminal(job: ProcessingJob): boolean {
    return (
      job.status === ProcessingStatus.COMPLETED ||
      job.status === ProcessingStatus.FAILED ||
      job.status === ProcessingStatus.CANCELLED
    );
  }

  static isRunning(job: ProcessingJob): boolean {
    return job.status === ProcessingStatus.RUNNING;
  }

  static canRetry(job: ProcessingJob): boolean {
    return job.status === ProcessingStatus.FAILED;
  }

  static isPending(job: ProcessingJob): boolean {
    return (
      job.status === ProcessingStatus.PENDING ||
      job.status === ProcessingStatus.RETRYING
    );
  }

  static getExecutionTime(job: ProcessingJob): number | null {
    if (!job.startedAt) return null;
    const endTime = job.completedAt || new Date();
    return endTime.getTime() - job.startedAt.getTime();
  }

  static canTransitionTo(
    currentStatus: ProcessingStatus,
    newStatus: ProcessingStatus,
  ): boolean {
    const validTransitions: Record<ProcessingStatus, ProcessingStatus[]> = {
      [ProcessingStatus.PENDING]: [
        ProcessingStatus.RUNNING,
        ProcessingStatus.CANCELLED,
      ],
      [ProcessingStatus.RUNNING]: [
        ProcessingStatus.COMPLETED,
        ProcessingStatus.FAILED,
        ProcessingStatus.CANCELLED,
      ],
      [ProcessingStatus.COMPLETED]: [],
      [ProcessingStatus.FAILED]: [ProcessingStatus.RETRYING],
      [ProcessingStatus.CANCELLED]: [],
      [ProcessingStatus.RETRYING]: [
        ProcessingStatus.RUNNING,
        ProcessingStatus.CANCELLED,
      ],
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }
}
