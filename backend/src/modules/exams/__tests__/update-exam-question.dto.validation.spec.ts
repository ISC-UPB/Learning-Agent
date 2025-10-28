import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateExamQuestionDto } from '../infrastructure/http/dtos/update-exam-question.dto';

describe('UpdateExamQuestionDto Validation', () => {
  it('debería fallar con payload inválido', async () => {
    const payload = { correctOptionIndex: 'no-numero' };
    const dto = plainToInstance(UpdateExamQuestionDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('debería pasar con payload válido', async () => {
    const payload = {
      kind: 'MULTIPLE_CHOICE',
      text: 'Pregunta actualizada',
      options: ['A', 'B'],
      correctOptionIndex: 1,
    };
    const dto = plainToInstance(UpdateExamQuestionDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
