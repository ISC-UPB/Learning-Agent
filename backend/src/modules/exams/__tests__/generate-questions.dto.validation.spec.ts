import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GenerateQuestionsDto } from '../infrastructure/http/dtos/generate-questions.dto';

describe('GenerateQuestionsDto Validation', () => {
  it('debería fallar con payload inválido', async () => {
    const payload = {};
    const dto = plainToInstance(GenerateQuestionsDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('debería pasar con payload válido', async () => {
    const payload = {
      subject: 'Matemáticas',
      difficulty: 'fácil',
      totalQuestions: 5,
      examId: '550e8400-e29b-41d4-a716-446655440000'
    };
    const dto = plainToInstance(GenerateQuestionsDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
