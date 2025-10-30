import { Injectable, Logger } from '@nestjs/common';
import { ProcessingJob, ProcessingStatus, ProcessingType } from '../../domain/entities/processing-job.entity';
import { ProcessingJobRepositoryPort } from '../../domain/ports/processing-job-repository.port';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { Prisma, ProcessingStatus as PrismaStatus, ProcessingType as PrismaType } from '@prisma/client';

@Injectable()
export class PrismaProcessingJobRepositoryAdapter implements ProcessingJobRepositoryPort {
  private readonly logger = new Logger(PrismaProcessingJobRepositoryAdapter.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mapea una entidad ProcessingJob al modelo de Prisma
   */
  private toDatabase(job: ProcessingJob) {
    return {
      id: job.id,
      documentId: job.documentId,
      jobType: job.jobType as unknown as PrismaType,
      status: job.status as unknown as PrismaStatus,
      errorMessage: job.errorMessage,
      progress: job.progress,
      jobDetails: job.jobDetails ? {
        ...job.jobDetails,
        progressMessage: job.progressMessage,
        retryCount: job.retryCount,
        parentJobId: job.parentJobId,
      } : {},
      result: job.result,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
    };
  }

  /**
   * Mapea un modelo de Prisma a una entidad ProcessingJob
   */
  private toDomain(data: any): ProcessingJob {
    const jobDetails = data.jobDetails || {};
    return new ProcessingJob(
      data.id,
      data.documentId,
      data.jobType as ProcessingType,
      data.status as ProcessingStatus,
      data.progress,
      data.errorMessage,
      jobDetails,
      data.result,
      data.startedAt,
      data.completedAt,
      data.createdAt,
      jobDetails.progressMessage,
      jobDetails.retryCount || 0,
      jobDetails.parentJobId
    );
  }

  async save(job: ProcessingJob): Promise<ProcessingJob> {
    try {
      const data = this.toDatabase(job);
      const savedJob = await this.prisma.processingJob.upsert({
        where: { id: job.id },
        create: data,
        update: data,
      });

      return this.toDomain(savedJob);
    } catch (error) {
      this.logger.error(`Error saving processing job ${job.id}:`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<ProcessingJob | null> {
    try {
      const job = await this.prisma.processingJob.findUnique({
        where: { id },
      });

      return job ? this.toDomain(job) : null;
    } catch (error) {
      this.logger.error(`Error finding processing job ${id}:`, error);
      throw error;
    }
  }

  async findByDocumentAndType(
    documentId: string,
    jobType: ProcessingType,
  ): Promise<ProcessingJob[]> {
    try {
      const jobs = await this.prisma.processingJob.findMany({
        where: {
          documentId,
          jobType: jobType as unknown as PrismaType,
        },
        orderBy: { createdAt: 'desc' },
      });

      return jobs.map(job => this.toDomain(job));
    } catch (error) {
      this.logger.error(
        `Error finding processing jobs for document ${documentId} and type ${jobType}:`,
        error,
      );
      throw error;
    }
  }

  async findActiveByDocument(documentId: string): Promise<ProcessingJob[]> {
    try {
      const jobs = await this.prisma.processingJob.findMany({
        where: {
          documentId,
          status: {
            in: [
              ProcessingStatus.PENDING,
              'IN_PROGRESS' as PrismaStatus,
              ProcessingStatus.RETRYING,
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return jobs.map(job => this.toDomain(job));
    } catch (error) {
      this.logger.error(
        `Error finding active jobs for document ${documentId}:`,
        error,
      );
      throw error;
    }
  }

  async findByStatus(status: ProcessingStatus): Promise<ProcessingJob[]> {
    try {
      const jobs = await this.prisma.processingJob.findMany({
        where: { status: status as unknown as PrismaStatus },
        orderBy: { createdAt: 'desc' },
      });

      return jobs.map(job => this.toDomain(job));
    } catch (error) {
      this.logger.error(
        `Error finding processing jobs with status ${status}:`,
        error,
      );
      throw error;
    }
  }

  async markStaleJobsAsFailed(olderThan: Date): Promise<number> {
    try {
      const result = await this.prisma.processingJob.updateMany({
        where: {
          status: {
            in: ['PENDING', 'IN_PROGRESS', 'RETRYING'] as PrismaStatus[],
          },
          createdAt: {
            lt: olderThan,
          },
        },
        data: {
          status: ProcessingStatus.FAILED,
          errorMessage: 'Job marked as failed due to timeout',
          completedAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      this.logger.error('Error marking stale jobs as failed:', error);
      throw error;
    }
  }

  async findDuplicateJobs(
    documentId: string,
    jobType: string,
    contentHash: string
  ): Promise<ProcessingJob[]> {
    try {
      const jobs = await this.prisma.$queryRaw<Array<any>>`
        SELECT *
        FROM "ProcessingJob"
        WHERE "documentId" = ${documentId}
        AND "jobType" = ${jobType}::text::"ProcessingType"
        AND "jobDetails"->>'contentHash' = ${contentHash}
        AND "status" IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')
        ORDER BY "createdAt" DESC
      `;

      return jobs.map(job => this.toDomain(job));
    } catch (error) {
      this.logger.error(
        `Error finding duplicate jobs for document ${documentId} and type ${jobType}:`,
        error,
      );
      throw error;
    }
  }

  async updateProgress(
    jobId: string,
    progress: number,
    message?: string
  ): Promise<ProcessingJob> {
    try {
      if (progress < 0 || progress > 100) {
        throw new Error(`Invalid progress value ${progress}. Must be between 0 and 100.`);
      }

      const job = await this.prisma.processingJob.update({
        where: { id: jobId },
        data: {
          progress,
          jobDetails: await (async () => {
            const existingJob = await this.prisma.processingJob.findUnique({
              where: { id: jobId },
              select: { jobDetails: true }
            });
            return {
              ...(existingJob?.jobDetails as Record<string, any> || {}),
              progressMessage: message,
            };
          })(),
        },
      });

      return this.toDomain(job);
    } catch (error) {
      this.logger.error(`Error updating progress for job ${jobId}:`, error);
      throw error;
    }
  }

  async findLastSuccessfulJob(
    documentId: string,
    jobType: string
  ): Promise<ProcessingJob | null> {
    try {
      const job = await this.prisma.processingJob.findFirst({
        where: {
          documentId,
          jobType: jobType as unknown as PrismaType,
          status: 'COMPLETED' as PrismaStatus,
        },
        orderBy: { completedAt: 'desc' },
      });

      return job ? this.toDomain(job) : null;
    } catch (error) {
      this.logger.error(
        `Error finding last successful job for document ${documentId} and type ${jobType}:`,
        error,
      );
      throw error;
    }
  }

  async findRetryableJobs(): Promise<ProcessingJob[]> {
    try {
      const jobs = await this.prisma.$queryRaw<Array<any>>`
        SELECT *
        FROM "ProcessingJob"
        WHERE status = 'FAILED'
        AND (
          NOT (jobDetails ? 'retryCount')
          OR 
          CAST(jobDetails->>'retryCount' AS INTEGER) < 3
        )
        ORDER BY "createdAt" ASC;
      `;

      return jobs.map(job => this.toDomain(job));
    } catch (error) {
      this.logger.error('Error finding retryable jobs:', error);
      throw error;
    }
  }
}