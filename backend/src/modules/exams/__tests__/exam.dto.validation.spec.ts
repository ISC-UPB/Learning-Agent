import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PatchExamMetaDTO } from '../infrastructure/http/dtos/exam.dto';

describe('PatchExamMetaDTO Validation', () => {
  it('debería fallar con payload inválido', async () => {
    const payload = { status: 'INVALIDO' };
    const dto = plainToInstance(PatchExamMetaDTO, payload);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('debería pasar con payload válido', async () => {
    const payload = {
      title: 'Examen final',
      status: 'Guardado',
      classId: '550e8400-e29b-41d4-a716-446655440000'
    };
    const dto = plainToInstance(PatchExamMetaDTO, payload);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
