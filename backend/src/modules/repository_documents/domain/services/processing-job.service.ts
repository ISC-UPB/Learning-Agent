import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ProcessingJobRepositoryPort } from '../ports/processing-job-repository.port';
import {
  ProcessingJob,
  ProcessingType,
  ProcessingStatus,
} from '../entities/processing-job.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class ProcessingJobService {
  private readonly logger = new Logger(ProcessingJobService.name);

  constructor(
    @Inject('ProcessingJobRepositoryPort')
    private readonly jobRepository: ProcessingJobRepositoryPort,
  ) {}

  async createJobWithDeduplication(
    documentId: string,
    jobType: ProcessingType,
    jobDetails: Record<string, any>,
  ): Promise<ProcessingJob> {
    // Verificar duplicados basados en el hash de contenido
    if (jobDetails.contentHash) {
      const duplicates = await this.jobRepository.findDuplicateJobs(
        documentId,
        jobType,
        jobDetails.contentHash,
      );

      if (duplicates.length > 0) {
        this.logger.log(
          `Found existing job for document ${documentId} with hash ${jobDetails.contentHash}`,
        );
        return duplicates[0]; // Retornar el job existente
      }
    }

    // Crear nuevo job si no hay duplicados
    const newJob = ProcessingJobService.create(
      randomUUID(),
      documentId,
      jobType,
      jobDetails,
    );

    return this.jobRepository.save(newJob);
  }

  async retryJob(jobId: string): Promise<ProcessingJob | null> {
    const job = await this.jobRepository.findById(jobId);

    if (!job || !ProcessingJobService.canRetry(job)) {
      return null;
    }

    const retryJob = ProcessingJobService.retry(job);
    return this.jobRepository.save(retryJob);
  }

  async updateProgress(
    jobId: string,
    progress: number,
  ): Promise<ProcessingJob> {
    const job = await this.jobRepository.findById(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const updatedJob = ProcessingJobService.updateProgress(job, progress);
    return this.jobRepository.save(updatedJob);
  }

  async findActiveJobs(documentId: string): Promise<ProcessingJob[]> {
    return this.jobRepository.findActiveByDocument(documentId);
  }

  async findRetryableJobs(): Promise<ProcessingJob[]> {
    return this.jobRepository.findRetryableJobs();
  }

  async markStaleJobs(cutoffDate: Date): Promise<number> {
    return this.jobRepository.markStaleJobsAsFailed(cutoffDate);
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
      undefined,
      job.retryCount + 1,
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
