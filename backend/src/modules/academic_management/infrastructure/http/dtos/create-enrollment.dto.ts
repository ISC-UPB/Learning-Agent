import { IsNotEmpty, IsString, Length } from "class-validator";

/**
 * DTO for enrolling a student in a class.
 * @property studentId - Unique identifier of the student.
 * @property classId - Unique identifier of the class.
 */
export class CreateEnrollmentDto {
  @IsNotEmpty({ message: 'studentId is required.' })
  @IsString({ message: 'studentId must be a string.' })
  @Length(3, 50, { message: 'studentId must be between 3 and 50 characters.' })
  studentId: string;

  @IsNotEmpty({ message: 'classId is required.' })
  @IsString({ message: 'classId must be a string.' })
  @Length(3, 50, { message: 'classId must be between 3 and 50 characters.' })
  classId: string;
}
