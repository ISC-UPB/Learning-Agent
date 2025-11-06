import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import {
  ProcessingJob,
  ProcessingType,
  ProcessingStatus,
} from '../../domain/entities/processing-job.entity';
import { ProcessingJobService } from '../../domain/services/processing-job.service';
import type {
  ProcessingJobRepositoryPort,
  FindJobsOptions,
  FindJobsResult,
} from '../../domain/ports/processing-job-repository.port';

/**
 * Prisma adapter for ProcessingJob repository
 * Implements atomic operations and state transition validations
 */
@Injectable()
export class PrismaProcessingJobRepositoryAdapter
  implements ProcessingJobRepositoryPort
{
  private readonly logger = new Logger(
    PrismaProcessingJobRepositoryAdapter.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Save a processing job (create or update)
   */
  async save(job: ProcessingJob): Promise<ProcessingJob> {
    try {
      const savedJob = await this.prisma.processingJob.upsert({
        where: { id: job.id },
        create: {
          id: job.id,
          documentId: job.documentId,
          jobType: job.jobType,
          status: job.status,
          progress: job.progress,
          attemptCount: job.attemptCount,
          errorMessage: job.errorMessage,
          jobDetails: job.jobDetails as any,
          result: job.result as any,
          lastProcessedChunkIndex: job.lastProcessedChunkIndex,
          processedChunksCount: job.processedChunksCount,
          processedEmbeddingsCount: job.processedEmbeddingsCount,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        },
        update: {
          status: job.status,
          progress: job.progress,
          attemptCount: job.attemptCount,
          errorMessage: job.errorMessage,
          jobDetails: job.jobDetails as any,
          result: job.result as any,
          lastProcessedChunkIndex: job.lastProcessedChunkIndex,
          processedChunksCount: job.processedChunksCount,
          processedEmbeddingsCount: job.processedEmbeddingsCount,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          updatedAt: new Date(),
        },
      });

      return this.mapToEntity(savedJob);
    } catch (error) {
      this.logger.error(`Error saving processing job ${job.id}:`, error);
      throw new Error(`Error saving processing job: ${error}`);
    }
  }

  /**
   * Find a job by its ID
   */
  async findById(id: string): Promise<ProcessingJob | null> {
    try {
      const job = await this.prisma.processingJob.findUnique({
        where: { id },
      });

      return job ? this.mapToEntity(job) : null;
    } catch (error) {
      this.logger.error(`Error finding job ${id}:`, error);
      return null;
    }
  }

  /**
   * Find the latest active job for a document and type
   */
  async findActiveJobByDocumentAndType(
    documentId: string,
    jobType: ProcessingType,
  ): Promise<ProcessingJob | null> {
    try {
      const job = await this.prisma.processingJob.findFirst({
        where: {
          documentId,
          jobType,
          status: {
            in: [
              ProcessingStatus.PENDING,
              ProcessingStatus.RUNNING,
              ProcessingStatus.RETRYING,
            ],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return job ? this.mapToEntity(job) : null;
    } catch (error) {
      this.logger.error(
        `Error finding active job for document ${documentId} and type ${jobType}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Find all jobs for a document
   */
  async findByDocumentId(
    documentId: string,
    options: FindJobsOptions = {},
  ): Promise<FindJobsResult> {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'createdAt',
        orderDirection = 'desc',
      } = options;

      const [jobs, total] = await Promise.all([
        this.prisma.processingJob.findMany({
          where: { documentId },
          orderBy: { [orderBy]: orderDirection },
          take: limit,
          skip: offset,
        }),
        this.prisma.processingJob.count({
          where: { documentId },
        }),
      ]);

      return {
        jobs: jobs.map((job) => this.mapToEntity(job)),
        total,
      };
    } catch (error) {
      this.logger.error(
        `Error finding jobs for document ${documentId}:`,
        error,
      );
      return { jobs: [], total: 0 };
    }
  }

  /**
   * Find jobs by status
   */
  async findByStatus(
    status: ProcessingStatus,
    options: FindJobsOptions = {},
  ): Promise<FindJobsResult> {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'createdAt',
        orderDirection = 'desc',
      } = options;

      const [jobs, total] = await Promise.all([
        this.prisma.processingJob.findMany({
          where: { status },
          orderBy: { [orderBy]: orderDirection },
          take: limit,
          skip: offset,
        }),
        this.prisma.processingJob.count({
          where: { status },
        }),
      ]);

      return {
        jobs: jobs.map((job) => this.mapToEntity(job)),
        total,
      };
    } catch (error) {
      this.logger.error(`Error finding jobs by status ${status}:`, error);
      return { jobs: [], total: 0 };
    }
  }

  /**
   * Find jobs by type
   */
  async findByType(
    jobType: ProcessingType,
    options: FindJobsOptions = {},
  ): Promise<FindJobsResult> {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'createdAt',
        orderDirection = 'desc',
      } = options;

      const [jobs, total] = await Promise.all([
        this.prisma.processingJob.findMany({
          where: { jobType },
          orderBy: { [orderBy]: orderDirection },
          take: limit,
          skip: offset,
        }),
        this.prisma.processingJob.count({
          where: { jobType },
        }),
      ]);

      return {
        jobs: jobs.map((job) => this.mapToEntity(job)),
        total,
      };
    } catch (error) {
      this.logger.error(`Error finding jobs by type ${jobType}:`, error);
      return { jobs: [], total: 0 };
    }
  }

  /**
   * Update job status atomically with validation
   */
  async updateStatus(
    jobId: string,
    newStatus: ProcessingStatus,
    errorMessage?: string,
  ): Promise<ProcessingJob | null> {
    try {
      // Get current job to validate transition
      const currentJob = await this.findById(jobId);
      if (!currentJob) {
        this.logger.warn(`Job ${jobId} not found for status update`);
        return null;
      }

      // Validate transition
      if (
        !ProcessingJobService.canTransitionTo(currentJob.status, newStatus)
      ) {
        this.logger.warn(
          `Invalid status transition from ${currentJob.status} to ${newStatus} for job ${jobId}`,
        );
        return null;
      }

      // Prepare update data
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date(),
      };

      if (errorMessage) {
        updateData.errorMessage = errorMessage;
      }

      // Set timestamps based on status
      if (newStatus === ProcessingStatus.RUNNING) {
        updateData.startedAt = new Date();
        updateData.attemptCount = { increment: 1 };
      } else if (
        newStatus === ProcessingStatus.COMPLETED ||
        newStatus === ProcessingStatus.FAILED ||
        newStatus === ProcessingStatus.CANCELLED
      ) {
        updateData.completedAt = new Date();
        if (newStatus === ProcessingStatus.COMPLETED) {
          updateData.progress = 100;
        }
      }

      // Update atomically
      const updatedJob = await this.prisma.processingJob.update({
        where: { id: jobId },
        data: updateData,
      });

      this.logger.log(
        `Job ${jobId} status updated: ${currentJob.status} -> ${newStatus}`,
      );

      return this.mapToEntity(updatedJob);
    } catch (error) {
      this.logger.error(`Error updating status for job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Update job progress atomically
   */
  async updateProgress(
    jobId: string,
    progress: number,
    lastProcessedChunkIndex?: number,
    processedChunksCount?: number,
    processedEmbeddingsCount?: number,
  ): Promise<ProcessingJob | null> {
    try {
      const validProgress = Math.max(0, Math.min(100, progress));

      const updateData: any = {
        progress: validProgress,
        updatedAt: new Date(),
      };

      if (lastProcessedChunkIndex !== undefined) {
        updateData.lastProcessedChunkIndex = lastProcessedChunkIndex;
      }

      if (processedChunksCount !== undefined) {
        updateData.processedChunksCount = processedChunksCount;
      }

      if (processedEmbeddingsCount !== undefined) {
        updateData.processedEmbeddingsCount = processedEmbeddingsCount;
      }

      const updatedJob = await this.prisma.processingJob.update({
        where: { id: jobId },
        data: updateData,
      });

      return this.mapToEntity(updatedJob);
    } catch (error) {
      this.logger.error(`Error updating progress for job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Delete a job
   */
  async deleteById(id: string): Promise<void> {
    try {
      await this.prisma.processingJob.delete({
        where: { id },
      });
      this.logger.log(`Job ${id} deleted`);
    } catch (error) {
      this.logger.error(`Error deleting job ${id}:`, error);
      throw new Error(`Error deleting job: ${error}`);
    }
  }

  /**
   * Count jobs by status
   */
  async countByStatus(status: ProcessingStatus): Promise<number> {
    try {
      return await this.prisma.processingJob.count({
        where: { status },
      });
    } catch (error) {
      this.logger.error(`Error counting jobs by status ${status}:`, error);
      return 0;
    }
  }

  /**
   * Check if there's an active job for a document and type
   */
  async hasActiveJob(
    documentId: string,
    jobType: ProcessingType,
  ): Promise<boolean> {
    try {
      const count = await this.prisma.processingJob.count({
        where: {
          documentId,
          jobType,
          status: {
            in: [
              ProcessingStatus.PENDING,
              ProcessingStatus.RUNNING,
              ProcessingStatus.RETRYING,
            ],
          },
        },
        take: 1,
      });

      return count > 0;
    } catch (error) {
      this.logger.error(
        `Error checking active job for document ${documentId} and type ${jobType}:`,
        error,
      );
      return false;
    }
  }

  // ============ PRIVATE METHODS ============

  /**
   * Maps Prisma result to domain entity
   */
  private mapToEntity(prismaJob: any): ProcessingJob {
    return new ProcessingJob(
      prismaJob.id,
      prismaJob.documentId,
      prismaJob.jobType as ProcessingType,
      prismaJob.status as ProcessingStatus,
      prismaJob.progress,
      prismaJob.attemptCount,
      prismaJob.errorMessage,
      prismaJob.jobDetails,
      prismaJob.result,
      prismaJob.lastProcessedChunkIndex,
      prismaJob.processedChunksCount,
      prismaJob.processedEmbeddingsCount,
      prismaJob.startedAt,
      prismaJob.completedAt,
      prismaJob.createdAt,
      prismaJob.updatedAt,
    );
  }
}
