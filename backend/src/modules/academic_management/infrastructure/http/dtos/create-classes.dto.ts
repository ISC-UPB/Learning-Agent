import { IsNotEmpty, IsString, IsDate, Length, Validate } from 'class-validator';
import { Type } from 'class-transformer';
import { DateRangeValidator } from '../validators/date-range.validator';

/**
 * DTO for creating a new class.
 */
export class CreateClassDto {
  @IsNotEmpty({ message: 'teacherId is required.' })
  @IsString({ message: 'teacherId must be a string.' })
  @Length(3, 50, { message: 'teacherId must be between 3 and 50 characters.' })
  teacherId: string;

  @IsNotEmpty({ message: 'courseId is required.' })
  @IsString({ message: 'courseId must be a string.' })
  @Length(3, 50, { message: 'courseId must be between 3 and 50 characters.' })
  courseId: string;

  @IsNotEmpty({ message: 'semester is required.' })
  @IsString({ message: 'semester must be a string.' })
  @Length(4, 20, { message: 'semester must be between 4 and 20 characters.' })
  semester: string;

  @IsNotEmpty({ message: 'dateBegin is required.' })
  @IsDate({ message: 'dateBegin must be a valid Date object.' })
  @Type(() => Date)
  dateBegin: Date;

  @IsNotEmpty({ message: 'dateEnd is required.' })
  @IsDate({ message: 'dateEnd must be a valid Date object.' })
  @Type(() => Date)
  dateEnd: Date;

  /**
   * Dummy property to trigger class-level validation.
   */
  @Validate(DateRangeValidator, {
    message: 'dateBegin must be earlier than dateEnd.',
  })
  dateRangeCheck: boolean;
}
