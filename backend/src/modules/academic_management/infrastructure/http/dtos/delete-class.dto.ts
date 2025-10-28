import { IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * DTO for deleting a class.
 * @property teacherId - Unique identifier of the teacher.
 */
export class DeleteClassDTO {
  @IsNotEmpty({ message: 'teacherId is required.' })
  @IsString({ message: 'teacherId must be a string.' })
  @Length(3, 50, { message: 'teacherId must be between 3 and 50 characters.' })
  teacherId: string;
}
