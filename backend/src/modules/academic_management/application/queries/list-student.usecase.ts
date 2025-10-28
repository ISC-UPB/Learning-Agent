import { Inject, Injectable, Logger } from '@nestjs/common';
import { STUDENT_REPO } from '../../tokens';
import type { StudentRepositoryPort } from '../../domain/ports/student.repository.ports';
import { Student } from '../../domain/entities/student.entity';

@Injectable()
export class ListStudentsUseCase {
  private readonly logger = new Logger(ListStudentsUseCase.name);

  constructor(
    @Inject(STUDENT_REPO) private readonly classRepo: StudentRepositoryPort,
  ) {}

  async execute(): Promise<Student[]> {
    this.logger.log('Entry: execute - listing students');

    try {
      const students = await this.classRepo.list();
      this.logger.log(`Success: ${students.length} students retrieved`);
      return students;
    } catch (error) {
      this.logger.error('Error listing students', error.stack);
      throw error;
    }
  }
}
