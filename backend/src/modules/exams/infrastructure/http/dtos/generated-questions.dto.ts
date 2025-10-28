import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GeneratedQuestionBaseDto {
  @IsString() @IsNotEmpty()
  text!: string;

  @IsIn(['multiple_choice', 'true_false', 'open_analysis', 'open_exercise'], {
    message: 'type inválido'
  })
  type!: 'multiple_choice' | 'true_false' | 'open_analysis' | 'open_exercise';
}

export class GeneratedMCQDto extends GeneratedQuestionBaseDto {
  @IsArray() @IsString({ each: true })
  options!: string[];

  @IsOptional()
  correctOptionIndex?: number;
}

export class GeneratedTrueFalseDto extends GeneratedQuestionBaseDto {
  @IsOptional()
  correctBoolean?: boolean;
}

export class GeneratedOpenDto extends GeneratedQuestionBaseDto {
  @IsOptional()
  expectedAnswer?: string;
}

export class GeneratedQuestionsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => GeneratedMCQDto)
  multiple_choice!: GeneratedMCQDto[];

  @IsArray() @ValidateNested({ each: true }) @Type(() => GeneratedTrueFalseDto)
  true_false!: GeneratedTrueFalseDto[];

  @IsArray() @ValidateNested({ each: true }) @Type(() => GeneratedOpenDto)
  open_analysis!: GeneratedOpenDto[];

  @IsArray() @ValidateNested({ each: true }) @Type(() => GeneratedOpenDto)
  open_exercise!: GeneratedOpenDto[];
}
