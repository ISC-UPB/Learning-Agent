import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsObject,
  IsDate,
  IsNumber,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

enum InterviewQuestionType {
  MULTIPLE_SELECTION = 'multiple_selection',
  DOUBLE_SELECTION = 'double_selection',
  OPEN_QUESTION = 'open_question',
}

export class CreateInterviewQuestionDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  courseId: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  docId: string;

  @IsNotEmpty()
  @IsEnum(InterviewQuestionType)
  type: 'multiple_selection' | 'double_selection' | 'open_question';

  @IsOptional()
  @IsObject()
  json?: any;
}

export class UpdateInterviewQuestionDto {
  @IsOptional()
  @IsObject()
  json?: any;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastUsedAt?: Date;
}

export class CreateChatHistoryDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  studentId: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  docId: string;

  @IsNotEmpty()
  @IsString()
  question: string;

  @IsNotEmpty()
  @IsString()
  response: string;
}

export class UpdateChatHistoryDto {
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(0)
  uses?: number;
}
