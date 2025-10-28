import { Exam } from '../entities/exam.entity';
import { ExamStatus } from '../constants/exam.constants';
import { Difficulty } from '../entities/difficulty.vo';
import { PositiveInt } from '../entities/positive-int.vo';

export class ExamMapper {
  
  static toDomain(raw: {
    id: string;
    title: string;
    status: ExamStatus;
    classId: string;
    difficulty: string;
    attempts: number;
    timeMinutes: number;
    reference: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Exam {
    
    return Exam.rehydrate({
      id: raw.id,
      title: raw.title,
      status: raw.status,
      classId: raw.classId,
      difficulty: raw.difficulty,
      attempts: raw.attempts,
      timeMinutes: raw.timeMinutes,
      reference: raw.reference,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }


  static toPersistence(exam: Exam) {
    return {
      id: exam.id,
      title: exam.title,
      status: exam.status,
      classId: exam.classId,
      difficulty: exam.difficulty.getValue(),
      attempts: exam.attempts.getValue(),
      timeMinutes: exam.timeMinutes.getValue(),
      reference: exam.reference,
    };
  }
}
