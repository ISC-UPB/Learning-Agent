import { IsBoolean, IsDate, IsNotEmpty, IsString, ValidateNested, ArrayMinSize, Length } from "class-validator";
import { Type } from 'class-transformer';

/**
 * DTO for submitting attendance for a group of students.
 * @property teacherId - Unique identifier of the teacher.
 * @property date - Date of the attendance record.
 * @property studentRows - Array of student attendance rows.
 */
export class AttendenceGroupStudentDTO {
  @IsNotEmpty({ message: 'teacherId is required.' })
  @IsString({ message: 'teacherId must be a string.' })
  @Length(3, 50, { message: 'teacherId must be between 3 and 50 characters.' })
  teacherId: string;

  @IsNotEmpty({ message: 'date is required.' })
  @IsDate({ message: 'date must be a valid Date object.' })
  @Type(() => Date)
  date: Date;

  @IsNotEmpty({ message: 'studentRows is required.' })
  @ArrayMinSize(1, { message: 'studentRows must contain at least one entry.' })
  @ValidateNested({ each: true })
  @Type(() => AttendenceGroupStudentRow)
  studentRows: AttendenceGroupStudentRow[];
}

/**
 * Row DTO representing a student's attendance status.
 * @property studentId - Unique identifier of the student.
 * @property isPresent - Boolean indicating if the student was present.
 */
export class AttendenceGroupStudentRow {
  @IsNotEmpty({ message: 'studentId is required.' })
  @IsString({ message: 'studentId must be a string.' })
  @Length(3, 50, { message: 'studentId must be between 3 and 50 characters.' })
  studentId: string;

  @IsNotEmpty({ message: 'isPresent is required.' })
  @IsBoolean({ message: 'isPresent must be a boolean.' })
  isPresent: boolean;
}
