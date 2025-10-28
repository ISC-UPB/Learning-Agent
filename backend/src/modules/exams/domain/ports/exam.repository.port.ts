import { Exam } from '../entities/exam.entity';
import { DistributionDto } from '../../infrastructure/http/dtos/distribution.dto';
import { DocumentChunkDto } from '../../infrastructure/http/dtos/document-chunk.dto';

export interface ExamRepositoryPort {
  create(exam: Exam): Promise<Exam>;
  createExamWithDependencies(data: {
    exam: Exam;
    distributions: DistributionDto[];
    chunks: DocumentChunkDto[];
  }): Promise<Exam>;
  findByIdOwned(id: string, teacherId: string): Promise<Exam | null>;
  listByClassOwned(classId: string, teacherId: string): Promise<Exam[]>;
  updateMetaOwned(
    id: string,
    teacherId: string,
    patch: Partial<Pick<Exam, 'title' | 'status' | 'classId'>>
  ): Promise<Exam>;
  teacherOwnsClass(classId: string, teacherId: string): Promise<boolean>;
  deleteOwned(id: string, teacherId: string): Promise<void>;
}
