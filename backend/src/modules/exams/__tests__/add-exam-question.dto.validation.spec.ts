import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AddExamQuestionDto } from '../infrastructure/http/dtos/add-exam-question.dto';

describe('AddExamQuestionDto Validation', () => {
  it('debería fallar con payload inválido', async () => {
    const payload = {}; // vacío
    const dto = plainToInstance(AddExamQuestionDto, payload);
    const errors = await validate(dto);

    const mensajes = errors.flatMap(e => Object.values(e.constraints ?? {}));
    console.log('Errores:', mensajes);

    expect(mensajes).toEqual(
      expect.arrayContaining([
        'kind debe ser uno de: MULTIPLE_CHOICE, TRUE_FALSE, OPEN_ANALYSIS, OPEN_EXERCISE',
        'text no puede estar vacío',
        'text debe ser texto',
        'position debe ser uno de: start, middle, end'
      ])
    );
  });

  it('debería pasar con payload válido', async () => {
    const payload = {
      kind: 'MULTIPLE_CHOICE',
      text: '¿Cuál es la capital de Bolivia?',
      options: ['La Paz', 'Sucre'],
      correctOptionIndex: 1,
      position: 'start'
    };

    const dto = plainToInstance(AddExamQuestionDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
