import {
  CreateInterviewQuestionDto,
  UpdateInterviewQuestionDto,
} from '../../dtos/interview-exam.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export abstract class IntExamRepositoryPort {
  abstract create(createDto: CreateInterviewQuestionDto): Promise<any>;

  abstract findAll(): Promise<any[]>;

  abstract findOne(id: string): Promise<any>;

  abstract findByCourseId(
    courseId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<any>>;

  abstract findByDocId(
    docId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<any>>;

  abstract findByCourseAndDocument(
    courseId: string,
    docId: string,
  ): Promise<any[]>;

  abstract findByCourseAndDocumentAndType(
    courseId: string,
    docId: string,
    type: string,
  ): Promise<any[]>;

  abstract update(
    id: string,
    updateDto: UpdateInterviewQuestionDto,
  ): Promise<any>;

  abstract remove(id: string): Promise<any>;

  abstract markAsUsed(id: string): Promise<any>;

  abstract getRecentlyUsed(limit?: number): Promise<any[]>;

  abstract getRecent(limit?: number): Promise<any[]>;
}
