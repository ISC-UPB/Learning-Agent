import { ProcessingJob } from '../entities/processing-job.entity';

export interface ProcessingJobRepositoryPort {
  create(job: ProcessingJob): Promise<ProcessingJob>;
  findById(id: string): Promise<ProcessingJob | null>;
  findByDocumentId(documentId: string): Promise<ProcessingJob[]>;
  update(job: ProcessingJob): Promise<ProcessingJob>;
  delete(id: string): Promise<void>;
}
