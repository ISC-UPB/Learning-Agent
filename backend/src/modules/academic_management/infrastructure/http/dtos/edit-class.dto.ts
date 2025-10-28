import {
  IsNotEmpty,
  IsString,
  IsDate,
  Length,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DateRangeValidator } from '../validators/date-range.validator';

/**
 * DTO for editing a class.
 */
export class EditClassDTO {
  /** Unique identifier of the teacher. */
  @IsNotEmpty({ message: 'teacherId is required.' })
  @IsString({ message: 'teacherId must be a string.' })
  @Length(3, 50, { message: 'teacherId must be between 3 and 50 characters.' })
  teacherId: string;

  /** Name of the class. */
  @IsNotEmpty({ message: 'name is required.' })
  @IsString({ message: 'name must be a string.' })
  @Length(3, 100, { message: 'name must be between 3 and 100 characters.' })
  name: string;

  /** Semester label (e.g., "2025-Fall"). */
  @IsNotEmpty({ message: 'semester is required.' })
  @IsString({ message: 'semester must be a string.' })
  @Length(4, 20, { message: 'semester must be between 4 and 20 characters.' })
  semester: string;

  /** Start date of the class. */
  @IsNotEmpty({ message: 'dateBegin is required.' })
  @IsDate({ message: 'dateBegin must be a valid Date object.' })
  @Type(() => Date)
  dateBegin: Date;

  /** End date of the class. */
  @IsNotEmpty({ message: 'dateEnd is required.' })
  @IsDate({ message: 'dateEnd must be a valid Date object.' })
  @Type(() => Date)
  dateEnd: Date;

  /** Dummy property to trigger date range validation. */
  @Validate(DateRangeValidator, {
    message: 'dateBegin must be earlier than dateEnd.',
  })
  dateRangeCheck: boolean;
}
