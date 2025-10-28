import {
  IsArray, IsEnum, IsInt, IsOptional, IsString, IsUUID,
  MaxLength, Min, ValidateNested, IsBoolean
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertQuestionDTO {
  @IsEnum(['MULTIPLE_CHOICE','TRUE_FALSE','OPEN_ANALYSIS','OPEN_EXERCISE'] as const, {
    message: 'kind inválido'
  })
  kind!: any;

  @IsString()
  @MaxLength(2000)
  text!: string;

  @IsOptional() @IsArray() options?: unknown;
  @IsOptional() @IsInt() @Min(0) correctOptionIndex?: number;
  @IsOptional() @IsBoolean() correctBoolean?: boolean;
  @IsOptional() @IsString() @MaxLength(2000) expectedAnswer?: string;
  @IsInt() @Min(0) order!: number;
}

export class UpsertQuestionsDTO {
  @IsUUID('4', { message: 'examId debe ser UUID v4' })
  examId!: string;

  @IsArray({ message: 'items debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => UpsertQuestionDTO)
  items!: UpsertQuestionDTO[];
}
