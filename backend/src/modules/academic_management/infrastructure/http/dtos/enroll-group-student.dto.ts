import {
  IsNotEmpty,
  IsString,
  ValidateNested,
  ArrayMinSize,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for enrolling a group of students into a class.
 */
export class EnrollGroupStudentDTO {
  /** Unique identifier of the class. */
  @IsNotEmpty({ message: 'classId is required.' })
  @IsString({ message: 'classId must be a string.' })
  @Length(3, 50, { message: 'classId must be between 3 and 50 characters.' })
  classId: string;

  /** Array of student enrollment rows. */
  @IsNotEmpty({ message: 'studentRows is required.' })
  @ArrayMinSize(1, { message: 'studentRows must contain at least one entry.' })
  @ValidateNested({ each: true })
  @Type(() => EnrollGroupStudentRow)
  studentRows: EnrollGroupStudentRow[];
}

/**
 * Row DTO representing a student's enrollment data.
 */
export class EnrollGroupStudentRow {
  /** First name of the student. */
  @IsNotEmpty({ message: 'studentName is required.' })
  @IsString({ message: 'studentName must be a string.' })
  @Length(2, 50, { message: 'studentName must be between 2 and 50 characters.' })
  studentName: string;

  /** Last name of the student. */
  @IsNotEmpty({ message: 'studentLastname is required.' })
  @IsString({ message: 'studentLastname must be a string.' })
  @Length(2, 50, { message: 'studentLastname must be between 2 and 50 characters.' })
  studentLastname: string;

  /** Unique student code. */
  @IsNotEmpty({ message: 'studentCode is required.' })
  @IsString({ message: 'studentCode must be a string.' })
  @Length(3, 20, { message: 'studentCode must be between 3 and 20 characters.' })
  studentCode: string;
}
