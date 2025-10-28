import { validate } from 'class-validator';
import { EditClassDTO } from '../edit-class.dto';

describe('EditClassDTO', () => {
  it('should fail if dateBegin is not before dateEnd', async () => {
    const dto = new EditClassDTO();
    dto.teacherId = 'T001';
    dto.name = 'Math';
    dto.semester = '2025-Fall';
    dto.dateBegin = new Date('2025-12-01');
    dto.dateEnd = new Date('2025-11-01');

    const errors = await validate(dto);
    expect(errors.some(e => e.constraints?.['DateRangeValidator'])).toBe(true);
  });
});
