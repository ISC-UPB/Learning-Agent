import { IsArray, IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ValidateCorrectAnswer } from '../validators/correct-answer.validator';

export class UpdateExamQuestionDto {
  @IsOptional()
  kind!: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_ANALYSIS' | 'OPEN_EXERCISE';

  @IsOptional() @IsString({ message: 'text debe ser texto' }) @MaxLength(4000)
  text?: string;

  @IsOptional() @IsArray({ message: 'options debe ser un arreglo' })
  options?: string[];

  @IsOptional() @IsInt({ message: 'correctOptionIndex debe ser entero' })
  correctOptionIndex?: number;

  @IsOptional() @IsBoolean({ message: 'correctBoolean debe ser booleano' })
  correctBoolean?: boolean;

  @IsOptional() @IsString({ message: 'expectedAnswer debe ser texto' })
  expectedAnswer?: string;

  @IsOptional()
  @ValidateCorrectAnswer()
  correctAnswer?: number | boolean | null;
}
