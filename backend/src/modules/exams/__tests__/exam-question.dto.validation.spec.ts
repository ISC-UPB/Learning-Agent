import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpsertQuestionsDTO } from '../infrastructure/http/dtos/exam-question.dto';

describe('UpsertQuestionsDTO Validation', () => {
  it('debería fallar con payload inválido', async () => {
    const payload = {};
    const dto = plainToInstance(UpsertQuestionsDTO, payload);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('debería pasar con payload válido', async () => {
    const payload = {
      examId: '550e8400-e29b-41d4-a716-446655440000',
      items: [
        {
          kind: 'MULTIPLE_CHOICE',
          text: '¿2 + 2?',
          options: ['3', '4'],
          correctOptionIndex: 1,
          order: 1
        }
      ]
    };

    const dto = plainToInstance(UpsertQuestionsDTO, payload);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
