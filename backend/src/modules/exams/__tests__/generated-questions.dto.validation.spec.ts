import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GeneratedQuestionsDto } from '../infrastructure/http/dtos/generated-questions.dto';

describe('GeneratedQuestionsDto Validation', () => {
  it('debería pasar con payload válido', async () => {
    const payload = {
      multiple_choice: [
        { text: '¿2+2?', type: 'multiple_choice', options: ['3', '4'], correctOptionIndex: 1 }
      ],
      true_false: [
        { text: 'El sol es una estrella', type: 'true_false', correctBoolean: true }
      ],
      open_analysis: [
        { text: 'Analiza la economía boliviana', type: 'open_analysis', expectedAnswer: '...' }
      ],
      open_exercise: [
        { text: 'Describe un algoritmo de ordenamiento', type: 'open_exercise', expectedAnswer: '...' }
      ]
    };

    const dto = plainToInstance(GeneratedQuestionsDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
