import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { ProcessingJobRepositoryPort } from '../../domain/ports/processing-job-repository.port';
import { ProcessingJob } from '../../domain/entities/processing-job.entity';
import type { ProcessingStatus as PrismaStatus, ProcessingType as PrismaType, Prisma } from '@prisma/client';
import { ProcessingStatus, ProcessingType } from '../../domain/entities/processing-job.entity';

@Injectable()
export class PrismaProcessingJobRepository implements ProcessingJobRepositoryPort {
  private readonly logger = new Logger(PrismaProcessingJobRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async save(job: ProcessingJob): Promise<ProcessingJob> {
    const saved = await this.prisma.processingJob.upsert({
      where: { id: job.id },
      update: {
        status: job.status,
        progress: job.progress,
        errorMessage: job.errorMessage,
        result: job.result,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        jobDetails: {
          ...job.jobDetails,
          progressMessage: job.progressMessage,
          retryCount: job.retryCount,
          parentJobId: job.parentJobId,
        },
      },
      create: {
        id: job.id,
        documentId: job.documentId,
        jobType: job.jobType,
        status: job.status,
        progress: job.progress,
        errorMessage: job.errorMessage,
        jobDetails: {
          ...job.jobDetails,
          progressMessage: job.progressMessage,
          retryCount: job.retryCount,
          parentJobId: job.parentJobId,
        },
        result: job.result,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt,
      },
    });

    return this.mapToEntity(saved);
  }

  async findById(id: string): Promise<ProcessingJob | null> {
    const job = await this.prisma.processingJob.findUnique({
      where: { id },
    });

    return job ? this.mapToEntity(job) : null;
  }

  async findActiveByDocument(documentId: string): Promise<ProcessingJob[]> {
    const jobs = await this.prisma.processingJob.findMany({
      where: {
        documentId,
        status: {
          in: ['PENDING', 'RUNNING', 'RETRYING'] as PrismaStatus[],
        },
      },
    });

    return jobs.map((job) => this.mapToEntity(job));
  }

  async markStaleJobsAsFailed(cutoffDate: Date): Promise<number> {
    const result = await this.prisma.processingJob.updateMany({
      where: {
        status: {
          in: ['RUNNING', 'RETRYING'] as PrismaStatus[],
        },
        startedAt: {
          lt: cutoffDate,
        },
      },
      data: {
        status: 'FAILED' as PrismaStatus,
        errorMessage: 'Job marked as failed due to timeout',
        completedAt: new Date(),
      },
    });

    return result.count;
  }

  async findDuplicateJobs(
    documentId: string,
    jobType: string,
    contentHash: string,
  ): Promise<ProcessingJob[]> {
    const jobs = await this.prisma.$queryRaw<Array<any>>`
      SELECT * 
      FROM "ProcessingJob"
      WHERE "documentId" = ${documentId}
      AND "jobType" = ${jobType}::text::"ProcessingType"
      AND status IN ('COMPLETED', 'RUNNING')
      AND jobDetails->>'contentHash' = ${contentHash}
      ORDER BY "createdAt" DESC;
    `;

    return jobs.map((job) => this.mapToEntity(job));
  }

  async updateProgress(
    jobId: string,
    progress: number,
    message?: string,
  ): Promise<ProcessingJob> {
    const existingJob = await this.prisma.processingJob.findUnique({
      where: { id: jobId },
      select: { jobDetails: true }
    });

    const updated = await this.prisma.processingJob.update({
      where: { id: jobId },
      data: {
        progress,
        jobDetails: {
          ...(existingJob?.jobDetails as Record<string, any> || {}),
          progressMessage: message,
        },
      },
    });

    return this.mapToEntity(updated);
  }

  async findLastSuccessfulJob(
    documentId: string,
    jobType: string,
  ): Promise<ProcessingJob | null> {
    const job = await this.prisma.processingJob.findFirst({
      where: {
        documentId,
        jobType: jobType as PrismaType,
        status: 'COMPLETED' as PrismaStatus,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    return job ? this.mapToEntity(job) : null;
  }

  async findRetryableJobs(): Promise<ProcessingJob[]> {
    const jobs = await this.prisma.$queryRaw<Array<any>>`
      SELECT *
      FROM "ProcessingJob"
      WHERE status = 'FAILED'
      AND (
        NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(CAST(jobDetails->'retryCount' AS jsonb)) as retries
          WHERE CAST(retries AS integer) >= 3
        )
      )
      ORDER BY "createdAt" ASC;
    `;

    return jobs.map((job) => this.mapToEntity(job));
  }

  private mapToEntity(prismaJob: any): ProcessingJob {
    return new ProcessingJob(
      prismaJob.id,
      prismaJob.documentId,
      prismaJob.jobType as unknown as ProcessingType,
      prismaJob.status as ProcessingStatus,
      prismaJob.progress,
      prismaJob.errorMessage,
      prismaJob.jobDetails,
      prismaJob.result,
      prismaJob.startedAt,
      prismaJob.completedAt,
      prismaJob.createdAt,
      prismaJob.progressMessage,
      prismaJob.retryCount,
      prismaJob.parentJobId,
    );
  }
}