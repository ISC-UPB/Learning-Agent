import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateExamDto } from '../infrastructure/http/dtos/create-exam.dto';

describe(' CreateExamDto Validation', () => {
  it('debería fallar con payload inválido', async () => {
    const invalidPayload = {
      title: '',
      classId: '123',
      subject: '',
      difficulty: '',
      attempts: 0,
      totalQuestions: 2000,
      timeMinutes: 10,
      status: 'Invalido',
      distribution: { multiple_choice: -5 },
    };

    
    const dto = plainToInstance(CreateExamDto, invalidPayload);

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

   
    const messages = errors.map(e => Object.values(e.constraints ?? {})).flat();
    console.log(' Errores:', messages);

  
    expect(messages).toContain('title es obligatorio');
    expect(messages.some(m => m.includes('classId'))).toBeTruthy();
  });

  it(' debería pasar con payload válido', async () => {
    const validPayload = {
      title: 'Examen de Matemáticas',
      classId: '550e8400-e29b-41d4-a716-446655440000',
      subject: 'Álgebra',
      difficulty: 'Media',
      attempts: 3,
      totalQuestions: 30,
      timeMinutes: 90,
      reference: 'Guía de estudio',
      distribution: { multiple_choice: 10, true_false: 5 },
      status: 'Guardado',
    };

    const dto = plainToInstance(CreateExamDto, validPayload);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });
});
