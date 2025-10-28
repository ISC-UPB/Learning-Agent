import { IsNotEmpty, IsString, IsOptional, IsNumber, Length, Min, Max } from 'class-validator';

/**
 * DTO for creating a student profile.
 * @property userId - Unique identifier of the user.
 * @property code - Student code (e.g., registration number).
 * @property career - Optional career name.
 * @property admissionYear - Optional year of admission (between 1900 and current year).
 */
export class CreateStudentDto {
  @IsNotEmpty({ message: 'userId is required.' })
  @IsString({ message: 'userId must be a string.' })
  @Length(3, 50, { message: 'userId must be between 3 and 50 characters.' })
  userId: string;

  @IsNotEmpty({ message: 'code is required.' })
  @IsString({ message: 'code must be a string.' })
  @Length(3, 20, { message: 'code must be between 3 and 20 characters.' })
  code: string;

  @IsOptional()
  @IsString({ message: 'career must be a string.' })
  @Length(3, 50, { message: 'career must be between 3 and 50 characters.' })
  career?: string;

  @IsOptional()
  @IsNumber({}, { message: 'admissionYear must be a number.' })
  @Min(1900, { message: 'admissionYear must be no earlier than 1900.' })
  @Max(new Date().getFullYear(), { message: 'admissionYear cannot be in the future.' })
  admissionYear?: number;
}
