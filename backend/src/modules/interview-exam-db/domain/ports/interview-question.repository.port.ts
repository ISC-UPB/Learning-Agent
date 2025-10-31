import { InterviewQuestion } from '../../domain/entities/interview-question.entity';

export interface InterviewQuestionRepositoryPort {
  create(question: InterviewQuestion): Promise<InterviewQuestion>;
  findAll(): Promise<InterviewQuestion[]>;
  findOne(id: string): Promise<InterviewQuestion>;
  findByCourseId(courseId: string, page?: number, limit?: number): Promise<{
    data: InterviewQuestion[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;
  findByDocId(docId: string, page?: number, limit?: number): Promise<{
    data: InterviewQuestion[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;
  findByCourseAndDocument(courseId: string, docId: string): Promise<InterviewQuestion[]>;
  update(id: string, question: Partial<InterviewQuestion>): Promise<InterviewQuestion>;
  remove(id: string): Promise<void>;
  markAsUsed(id: string): Promise<InterviewQuestion>;
  getRecentlyUsed(limit?: number): Promise<InterviewQuestion[]>;
  getRecent(limit?: number): Promise<InterviewQuestion[]>;
  findByCourseAndDocumentAndType(courseId: string, docId: string, type: string): Promise<InterviewQuestion[]>;
}