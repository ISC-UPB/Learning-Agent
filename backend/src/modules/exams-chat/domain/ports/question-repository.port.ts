import { Question } from '../entities/question.entity';

export interface QuestionRepositoryPort {
  save(question: Question): Promise<Question>;
  findById(id: string): Promise<Question | null>;
  findAll(): Promise<Question[]>;
  findByStatus(status: string, limit?: number, offset?: number): Promise<Question[]>;
  findBySignature(signature: string): Promise<Question | null>;
  incrementUsage(id: string, tokensUsed?: number): Promise<void>;
  deleteOlderThan(date: Date): Promise<number>;
  countByCourse(courseId: string): Promise<number>;
  pruneToLimitByCourse(courseId: string, limit: number): Promise<void>;
}
