import {
  ProcessingJob,
  ProcessingType,
  ProcessingStatus,
} from '../entities/processing-job.entity';

export class ProcessingJobService {
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
   * Checks if the job is in a terminal state (completed or failed)
   */
  static isTerminal(job: ProcessingJob): boolean {
    return (
      job.status === ProcessingStatus.COMPLETED ||
      job.status === ProcessingStatus.FAILED ||
      job.status === ProcessingStatus.CANCELLED
    );
  }

  /**
   * Checks if the job is running
   */
  static isRunning(job: ProcessingJob): boolean {
    return job.status === ProcessingStatus.RUNNING;
  }

  /**
   * Checks if the job can be retried
   */
  static canRetry(job: ProcessingJob): boolean {
    return job.status === ProcessingStatus.FAILED;
  }

  /**
   * Checks if the job is pending
   */
  static isPending(job: ProcessingJob): boolean {
    return (
      job.status === ProcessingStatus.PENDING ||
      job.status === ProcessingStatus.RETRYING
    );
  }

  /**
   * Calculates the execution time of the job
   */
  static getExecutionTime(job: ProcessingJob): number | null {
    if (!job.startedAt) return null;

    const endTime = job.completedAt || new Date();
    return endTime.getTime() - job.startedAt.getTime();
  }

  /**
   * Validates state transitions
   */
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
