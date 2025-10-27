import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { ProcessingJobRepositoryPort } from '../../domain/ports/processing-job-repository.port';
import { ProcessingJob, ProcessingStatus, ProcessingType } from '../../domain/entities/processing-job.entity';

@Injectable()
export class PrismaProcessingJobRepositoryAdapter implements ProcessingJobRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(job: ProcessingJob): Promise<ProcessingJob> {
  try {
    const record = await this.prisma.processingJob.create({
      data: {
        id: job.id,
        documentId: job.documentId,
        jobType: job.jobType,
        status: job.status,
        progress: job.progress,
        errorMessage: job.errorMessage,
        jobDetails: job.jobDetails ?? {},
        result: job.result ?? {},
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt,
      },
    });

    return this.toDomain(record);
  } catch (error: any) {
    
    if (error.code === 'P2002') {
      const existing = await this.prisma.processingJob.findUnique({
        where: {
          documentId_jobType: {
            documentId: job.documentId,
            jobType: job.jobType,
          },
        },
      });

      if (existing) {
       
        return this.toDomain(existing);
      }
    }

    throw error;
  }
}


  async findById(id: string): Promise<ProcessingJob | null> {
    const record = await this.prisma.processingJob.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByDocumentId(documentId: string): Promise<ProcessingJob[]> {
    const records = await this.prisma.processingJob.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async update(job: ProcessingJob): Promise<ProcessingJob> {
    const record = await this.prisma.processingJob.update({
      where: { id: job.id },
      data: {
        status: job.status,
        progress: job.progress,
        errorMessage: job.errorMessage,
        result: job.result,
        completedAt: job.completedAt,
      },
    });

    return this.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.processingJob.delete({ where: { id } });
  }

  private toDomain(record: any): ProcessingJob {
    return new ProcessingJob(
      record.id,
      record.documentId,
      record.jobType as ProcessingType,
      record.status as ProcessingStatus,
      record.progress,
      record.errorMessage ?? undefined,
      record.jobDetails ?? undefined,
      record.result ?? undefined,
      record.startedAt ?? undefined,
      record.completedAt ?? undefined,
      record.createdAt,
    );
  }
}
