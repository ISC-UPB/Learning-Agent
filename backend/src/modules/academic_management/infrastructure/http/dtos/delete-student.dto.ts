import { IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * DTO for deleting a student from a class.
 */
export class DeleteStudentDTO {
  /** Unique identifier of the teacher. */
  @IsNotEmpty({ message: 'teacherId is required.' })
  @IsString({ message: 'teacherId must be a string.' })
  @Length(3, 50, { message: 'teacherId must be between 3 and 50 characters.' })
  teacherId: string;

  /** Unique identifier of the student. */
  @IsNotEmpty({ message: 'studentId is required.' })
  @IsString({ message: 'studentId must be a string.' })
  @Length(3, 50, { message: 'studentId must be between 3 and 50 characters.' })
  studentId: string;
}
