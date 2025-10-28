import { validate } from 'class-validator';
import { CreateClassDto } from '../create-classes.dto';

describe('CreateClassDto', () => {
  it('should fail if dateBegin is after dateEnd', async () => {
    const dto = new CreateClassDto();
    dto.teacherId = 'T001';
    dto.courseId = 'C001';
    dto.semester = '2025-Fall';
    dto.dateBegin = new Date('2025-12-01');
    dto.dateEnd = new Date('2025-11-01');

    const errors = await validate(dto);
    expect(errors.some(e => e.constraints?.['DateRangeValidator'])).toBe(true);
  });

  it('should pass with valid dates', async () => {
    const dto = new CreateClassDto();
    dto.teacherId = 'T001';
    dto.courseId = 'C001';
    dto.semester = '2025-Fall';
    dto.dateBegin = new Date('2025-09-01');
    dto.dateEnd = new Date('2025-12-01');

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
