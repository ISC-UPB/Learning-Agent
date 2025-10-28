import { validate } from 'class-validator';
import { CreateStudentProfileDto } from '../create-studentProfile.dto';

describe('CreateStudentProfileDto', () => {
  it('should fail with invalid email and short password', async () => {
    const dto = new CreateStudentProfileDto();
    dto.name = 'Ana';
    dto.lastname = 'Lopez';
    dto.email = 'invalid-email';
    dto.password = '123';
    dto.code = 'STU001';

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'email')).toBe(true);
    expect(errors.some(e => e.property === 'password')).toBe(true);
  });

  it('should pass with valid data', async () => {
    const dto = new CreateStudentProfileDto();
    dto.name = 'Ana';
    dto.lastname = 'Lopez';
    dto.email = 'ana@example.com';
    dto.password = 'securePass123';
    dto.code = 'STU001';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
