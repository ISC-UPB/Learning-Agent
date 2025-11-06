import {
  ProcessingJob,
  ProcessingType,
  ProcessingStatus,
} from '../entities/processing-job.entity';

import { DeadLetterRepository } from '../../infrastructure/persistence/prisma-dead-letter.repository';

/**
 * Service to manage job lifecycle transitions (domain logic only).
 * Retry and backoff policies are handled by RetryService (infrastructure).
 */
export class ProcessingJobService {
  // DeadLetterRepository is injected at module initialization to avoid direct instantiation
  private static deadLetterRepo: DeadLetterRepository;

  /**
   * Set the DeadLetterRepository implementation (called by module provider at startup)
   * @throws Error if called without a valid repository
   */
  static setDeadLetterRepo(repo: DeadLetterRepository) {
    if (!repo) {
      throw new Error('[FATAL] DeadLetterRepository cannot be null. Ensure it is properly wired in documents.module.ts');
    }
    this.deadLetterRepo = repo;
  }

  /**
   * Validates that DeadLetterRepository has been injected
   * @throws Error if repository is not initialized
   */
  static validateDependencies() {
    if (!this.deadLetterRepo) {
      throw new Error('[FATAL] ProcessingJobService.deadLetterRepo not initialized. Call setDeadLetterRepo() during module initialization.');
    }
  }

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
      0, // attemptCount
      undefined, // errorMessage
      jobDetails,
      undefined, // result
      undefined, // lastProcessedChunkIndex
      0, // processedChunksCount
      0, // processedEmbeddingsCount
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
      job.attemptCount + 1, // Increment attempt count
      job.errorMessage,
      job.jobDetails,
      job.result,
      job.lastProcessedChunkIndex,
      job.processedChunksCount,
      job.processedEmbeddingsCount,
      new Date(),
      job.completedAt,
      job.createdAt,
    );
  }

  /**
   * Updates the job progress
   */
  static updateProgress(
    job: ProcessingJob,
    progress: number,
    lastProcessedChunkIndex?: number,
    processedChunksCount?: number,
    processedEmbeddingsCount?: number,
  ): ProcessingJob {
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
      job.attemptCount,
      job.errorMessage,
      job.jobDetails,
      job.result,
      lastProcessedChunkIndex ?? job.lastProcessedChunkIndex,
      processedChunksCount ?? job.processedChunksCount,
      processedEmbeddingsCount ?? job.processedEmbeddingsCount,
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
      job.attemptCount,
      job.errorMessage,
      job.jobDetails,
      result,
      job.lastProcessedChunkIndex,
      job.processedChunksCount,
      job.processedEmbeddingsCount,
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
      job.attemptCount,
      errorMessage,
      job.jobDetails,
      job.result,
      job.lastProcessedChunkIndex,
      job.processedChunksCount,
      job.processedEmbeddingsCount,
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
      job.attemptCount,
      job.errorMessage,
      job.jobDetails,
      job.result,
      job.lastProcessedChunkIndex,
      job.processedChunksCount,
      job.processedEmbeddingsCount,
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
      job.attemptCount, // Keep attempt count for retry
      undefined,
      job.jobDetails,
      undefined,
      job.lastProcessedChunkIndex, // Preserve progress for resume
      job.processedChunksCount, // Preserve progress for resume
      job.processedEmbeddingsCount, // Preserve progress for resume
      undefined,
      undefined,
      job.createdAt,
    );
  }

  /**
   * Checks if the job is in a terminal state
   */
  static isTerminal(job: ProcessingJob): boolean {
    return (
      job.status === ProcessingStatus.COMPLETED ||
      job.status === ProcessingStatus.FAILED ||
      job.status === ProcessingStatus.CANCELLED ||
      job.status === ProcessingStatus.DEAD_LETTER
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
      [ProcessingStatus.FAILED]: [
        ProcessingStatus.RETRYING,
        ProcessingStatus.DEAD_LETTER,
      ],
      [ProcessingStatus.CANCELLED]: [],
      [ProcessingStatus.RETRYING]: [
        ProcessingStatus.RUNNING,
        ProcessingStatus.CANCELLED,
        ProcessingStatus.DEAD_LETTER,
      ],
      [ProcessingStatus.DEAD_LETTER]: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }
}

