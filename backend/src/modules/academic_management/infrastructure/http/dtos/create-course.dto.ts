import {
  IsNotEmpty,
  IsString,
  Length,
  IsDate,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DateRangeValidator } from '../validators/date-range.validator';

/**
 * DTO for creating a new course
 */
export class CreateCourseDTO {
  @IsNotEmpty({ message: 'Teacher ID is required' })
  @IsString({ message: 'Teacher ID must be a string' })
  teacherId: string;

  @IsNotEmpty({ message: 'Course name is required' })
  @IsString({ message: 'Course name must be a string' })
  @Length(3, 50, {
    message: 'Course name must be between 3 and 50 characters',
  })
  name: string;

  @Type(() => Date)
  @IsDate({ message: 'Start date must be a valid date' })
  dateBegin: Date;

  @Type(() => Date)
  @IsDate({ message: 'End date must be a valid date' })
  dateEnd: Date;

  /**
   * Dummy property to trigger class-level validation
   */
  @Validate(DateRangeValidator)
  validateDates: boolean;
}