import { validate } from 'class-validator';
import {
  AttendenceGroupStudentDTO,
  AttendenceGroupStudentRow,
} from '../attendence-group-student.dto';

describe('AttendenceGroupStudentDTO', () => {
  it('should fail if studentRows is missing or empty', async () => {
    const dto = new AttendenceGroupStudentDTO();
    dto.teacherId = 'T001';
    dto.date = new Date();
    dto.studentRows = [];

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'studentRows')).toBe(true);
  });

  it('should pass with valid studentRows', async () => {
    const dto = new AttendenceGroupStudentDTO();
    dto.teacherId = 'T001';
    dto.date = new Date();
    dto.studentRows = [
      {
        studentId: 'S001',
        isPresent: true,
      } as AttendenceGroupStudentRow,
    ];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
