import { Logger } from '@nestjs/common';

export enum ProcessingType {
  TEXT_EXTRACTION = 'TEXT_EXTRACTION',
  CHUNKING = 'CHUNKING',
  EMBEDDING_GENERATION = 'EMBEDDING_GENERATION',
  FULL_PROCESSING = 'FULL_PROCESSING',
  REPROCESSING = 'REPROCESSING',
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  RETRYING = 'RETRYING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export class ProcessingJob {
  private readonly logger = new Logger(ProcessingJob.name);

  constructor(
    public readonly id: string,
    public readonly documentId: string,
    public readonly jobType: ProcessingType,
    public readonly status: ProcessingStatus = ProcessingStatus.PENDING,
    public readonly progress: number = 0,
    public readonly errorMessage?: string,
    public readonly jobDetails?: Record<string, any>,
    public readonly result?: Record<string, any>,
    public readonly startedAt?: Date,
    public readonly completedAt?: Date,
    public readonly createdAt: Date = new Date(),
    public readonly progressMessage?: string,
    public readonly retryCount: number = 0,
    public readonly parentJobId?: string,
  ) {}

  static create(
    id: string,
    documentId: string,
    jobType: ProcessingType,
    jobDetails: Record<string, any>,
  ): ProcessingJob {
    return new ProcessingJob(
      id,
      documentId,
      jobType,
      ProcessingStatus.PENDING,
      0,
      undefined,
      jobDetails,
      undefined,
      undefined,
      undefined,
      new Date(),
      'Job created',
      0,
      undefined
    );
  }

  start(): ProcessingJob {
    if (this.status !== ProcessingStatus.PENDING) {
      throw new Error(`Cannot start job ${this.id} in status ${this.status}`);
    }

    return new ProcessingJob(
      this.id,
      this.documentId,
      this.jobType,
      ProcessingStatus.RUNNING,
      this.progress,
      undefined,
      this.jobDetails,
      this.result,
      new Date(),
      undefined,
      this.createdAt,
      'Job started',
      this.retryCount,
      this.parentJobId
    );
  }

  complete(result?: Record<string, any>): ProcessingJob {
    if (this.status !== ProcessingStatus.RUNNING) {
      throw new Error(`Cannot complete job ${this.id} in status ${this.status}`);
    }

    return new ProcessingJob(
      this.id,
      this.documentId,
      this.jobType,
      ProcessingStatus.COMPLETED,
      100,
      undefined,
      this.jobDetails,
      result,
      this.startedAt,
      new Date(),
      this.createdAt,
      'Job completed successfully',
      this.retryCount,
      this.parentJobId,
    );
  }

  fail(error: string): ProcessingJob {
    if (this.isTerminal()) {
      throw new Error(`Cannot fail job ${this.id} in terminal status ${this.status}`);
    }

    this.logger.error(`Job ${this.id} failed: ${error}`);

    return new ProcessingJob(
      this.id,
      this.documentId,
      this.jobType,
      ProcessingStatus.FAILED,
      this.progress,
      error,
      this.jobDetails,
      this.result,
      this.startedAt,
      new Date(),
      this.createdAt,
      'Job failed',
      this.retryCount,
      this.parentJobId,
    );
  }

  cancel(reason?: string): ProcessingJob {
    if (this.isTerminal()) {
      throw new Error(
        `Cannot cancel job ${this.id} in terminal status ${this.status}`,
      );
    }

    return new ProcessingJob(
      this.id,
      this.documentId,
      this.jobType,
      ProcessingStatus.CANCELLED,
      this.progress,
      reason,
      this.jobDetails,
      this.result,
      this.startedAt,
      new Date(),
      this.createdAt,
      'Job cancelled',
      this.retryCount,
      this.parentJobId
    );
  }

  retry(): ProcessingJob {
    if (!this.canRetry()) {
      throw new Error(`Cannot retry job ${this.id} in status ${this.status}`);
    }

    return new ProcessingJob(
      `retry-${this.id}-${Date.now()}`,
      this.documentId,
      this.jobType,
      ProcessingStatus.PENDING,
      0,
      undefined,
      { ...this.jobDetails, retryOf: this.id },
      undefined,
      undefined,
      undefined,
      new Date(),
      'Job created for retry',
      this.retryCount + 1,
      this.id
    );
  }

  updateProgress(progress: number): ProcessingJob {
    if (this.status !== ProcessingStatus.RUNNING) {
      throw new Error(
        `Cannot update progress for job ${this.id} in status ${this.status}`,
      );
    }

    if (progress < 0 || progress > 100) {
      throw new Error(
        `Invalid progress value ${progress} for job ${this.id}. Must be between 0 and 100.`,
      );
    }

    return new ProcessingJob(
      this.id,
      this.documentId,
      this.jobType,
      this.status,
      progress,
      this.errorMessage,
      this.jobDetails,
      this.result,
      this.startedAt,
      this.completedAt,
      this.createdAt,
      this.progressMessage,
      this.retryCount,
      this.parentJobId
    );
  }

  withProgressMessage(message: string): ProcessingJob {
    return new ProcessingJob(
      this.id,
      this.documentId,
      this.jobType,
      this.status,
      this.progress,
      this.errorMessage,
      this.jobDetails,
      this.result,
      this.startedAt,
      this.completedAt,
      this.createdAt,
      message,
      this.retryCount,
      this.parentJobId
    );
  }

  isTerminal(): boolean {
    return (
      this.status === ProcessingStatus.COMPLETED ||
      this.status === ProcessingStatus.FAILED ||
      this.status === ProcessingStatus.CANCELLED
    );
  }

  canRetry(): boolean {
    return this.status === ProcessingStatus.FAILED && this.retryCount < 3;
  }
}