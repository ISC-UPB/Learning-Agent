import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  Length,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO for creating a student profile.
 */
export class CreateStudentProfileDto {
  /** Full name of the student (min 2, max 50 characters). */
  @IsNotEmpty({ message: 'name is required.' })
  @IsString({ message: 'name must be a string.' })
  @Length(2, 50, { message: 'name must be between 2 and 50 characters.' })
  name: string;

  /** Last name of the student (min 2, max 50 characters). */
  @IsNotEmpty({ message: 'lastname is required.' })
  @IsString({ message: 'lastname must be a string.' })
  @Length(2, 50, { message: 'lastname must be between 2 and 50 characters.' })
  lastname: string;

  /** Email address of the student. */
  @IsNotEmpty({ message: 'email is required.' })
  @IsEmail({}, { message: 'email must be a valid email address.' })
  email: string;

  /** Password for the student account (min 6 characters). */
  @IsNotEmpty({ message: 'password is required.' })
  @IsString({ message: 'password must be a string.' })
  @Length(6, 100, { message: 'password must be at least 6 characters.' })
  password: string;

  /** Whether the student account is active. */
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean.' })
  isActive?: boolean;

  /** Unique student code (e.g., registration number). */
  @IsNotEmpty({ message: 'code is required.' })
  @IsString({ message: 'code must be a string.' })
  @Length(3, 20, { message: 'code must be between 3 and 20 characters.' })
  code: string;

  /** Optional career name. */
  @IsOptional()
  @IsString({ message: 'career must be a string.' })
  @Length(3, 50, { message: 'career must be between 3 and 50 characters.' })
  career?: string;

  /** Optional year of admission (between 1900 and current year). */
  @IsOptional()
  @IsNumber({}, { message: 'admissionYear must be a number.' })
  @Min(1900, { message: 'admissionYear must be no earlier than 1900.' })
  @Max(new Date().getFullYear(), { message: 'admissionYear cannot be in the future.' })
  admissionYear?: number;
}
