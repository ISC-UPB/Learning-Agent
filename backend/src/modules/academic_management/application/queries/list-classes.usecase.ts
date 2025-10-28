import { Inject, Injectable, Logger } from '@nestjs/common';
import { CLASSES_REPO } from '../../tokens';
import type { ClassesRepositoryPort } from '../../domain/ports/classes.repository.ports';
import { Classes } from '../../domain/entities/classes.entity';

@Injectable()
export class ListClassesUseCase {
  private readonly logger = new Logger(ListClassesUseCase.name);

  constructor(
    @Inject(CLASSES_REPO) private readonly classRepo: ClassesRepositoryPort,
  ) {}

  async execute(): Promise<Classes[]> {
    this.logger.log('Entry: execute - listing classes');

    try {
      const classes = await this.classRepo.list();
      this.logger.log(`Success: ${classes.length} classes retrieved`);
      return classes;
    } catch (error) {
      this.logger.error('Error listing classes', error.stack);
      throw error;
    }
  }
}
