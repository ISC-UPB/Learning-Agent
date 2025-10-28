import { validate } from 'class-validator';
import { EnrollGroupStudentDTO, EnrollGroupStudentRow } from '../enroll-group-student.dto';

describe('EnrollGroupStudentDTO', () => {
  it('should fail if studentRows is empty', async () => {
    const dto = new EnrollGroupStudentDTO();
    dto.classId = 'CLS001';
    dto.studentRows = [];

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'studentRows')).toBe(true);
  });

  it('should pass with valid studentRows', async () => {
    const dto = new EnrollGroupStudentDTO();
    dto.classId = 'CLS001';
    dto.studentRows = [
      {
        studentName: 'Luis',
        studentLastname: 'Gomez',
        studentCode: 'STU123',
      } as EnrollGroupStudentRow,
    ];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
