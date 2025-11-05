import type {
  ProcessingJob,
  ProcessingType,
  ProcessingStatus,
} from '../entities/processing-job.entity';

/**
 * Options for finding processing jobs
 */
export interface FindJobsOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'startedAt' | 'completedAt';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Result for finding processing jobs
 */
export interface FindJobsResult {
  jobs: ProcessingJob[];
  total: number;
}

/**
 * Repository port for ProcessingJob operations
 * Handles persistence and retrieval of processing jobs
 */
export interface ProcessingJobRepositoryPort {
  /**
   * Save a processing job (create or update)
   */
  save(job: ProcessingJob): Promise<ProcessingJob>;

  /**
   * Find a job by its ID
   */
  findById(id: string): Promise<ProcessingJob | null>;

  /**
   * Find the latest active job for a document and type
   * Active means: PENDING, RUNNING, or RETRYING
   */
  findActiveJobByDocumentAndType(
    documentId: string,
    jobType: ProcessingType,
  ): Promise<ProcessingJob | null>;

  /**
   * Find all jobs for a document
   */
  findByDocumentId(
    documentId: string,
    options?: FindJobsOptions,
  ): Promise<FindJobsResult>;

  /**
   * Find jobs by status
   */
  findByStatus(
    status: ProcessingStatus,
    options?: FindJobsOptions,
  ): Promise<FindJobsResult>;

  /**
   * Find jobs by type
   */
  findByType(
    jobType: ProcessingType,
    options?: FindJobsOptions,
  ): Promise<FindJobsResult>;

  /**
   * Update job status atomically
   * Returns null if the job doesn't exist or the transition is invalid
   */
  updateStatus(
    jobId: string,
    newStatus: ProcessingStatus,
    errorMessage?: string,
  ): Promise<ProcessingJob | null>;

  /**
   * Update job progress atomically
   */
  updateProgress(
    jobId: string,
    progress: number,
    lastProcessedChunkIndex?: number,
    processedChunksCount?: number,
    processedEmbeddingsCount?: number,
  ): Promise<ProcessingJob | null>;

  /**
   * Delete a job
   */
  deleteById(id: string): Promise<void>;

  /**
   * Count jobs by status
   */
  countByStatus(status: ProcessingStatus): Promise<number>;

  /**
   * Check if there's an active job for a document and type
   */
  hasActiveJob(documentId: string, jobType: ProcessingType): Promise<boolean>;
}
