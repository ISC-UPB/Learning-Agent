import { IsNotEmpty, IsString, Length } from "class-validator";

/**
 * DTO for requesting absences by class.
 * @property teacherId - Unique identifier of the teacher (min 3, max 50 characters).
 */
export class AbsencesByClassDTO {
  @IsNotEmpty({ message: 'teacherId is required.' })
  @IsString({ message: 'teacherId must be a string.' })
  @Length(3, 50, { message: 'teacherId must be between 3 and 50 characters.' })
  teacherId: string;
}
