import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class AddExamQuestionDto {
  @IsIn(['MULTIPLE_CHOICE','TRUE_FALSE','OPEN_ANALYSIS','OPEN_EXERCISE'], {
    message: 'kind debe ser uno de: MULTIPLE_CHOICE, TRUE_FALSE, OPEN_ANALYSIS, OPEN_EXERCISE'
  })
  kind!: 'MULTIPLE_CHOICE'|'TRUE_FALSE'|'OPEN_ANALYSIS'|'OPEN_EXERCISE';

  @IsString({ message: 'text debe ser texto' })
  @IsNotEmpty({ message: 'text no puede estar vacío' })
  @MaxLength(4000, { message: 'text no debe superar 4000 caracteres' })
  text!: string;

  @ValidateIf(o => o.kind === 'MULTIPLE_CHOICE')
  @IsArray({ message: 'options debe ser un arreglo' })
  @IsString({ each: true, message: 'cada opción debe ser texto' })
  options?: string[];

  @ValidateIf(o => o.kind === 'MULTIPLE_CHOICE')
  @IsInt({ message: 'correctOptionIndex debe ser un entero' })
  @Min(0, { message: 'correctOptionIndex no puede ser negativo' })
  correctOptionIndex?: number;

  @ValidateIf(o => o.kind === 'TRUE_FALSE')
  @IsBoolean({ message: 'correctBoolean debe ser booleano' })
  correctBoolean?: boolean;

  @ValidateIf(o => o.kind === 'OPEN_ANALYSIS' || o.kind === 'OPEN_EXERCISE')
  @IsString({ message: 'expectedAnswer debe ser texto' })
  expectedAnswer?: string;

  @IsIn(['start','middle','end'], {
    message: 'position debe ser uno de: start, middle, end'
  })
  position!: 'start'|'middle'|'end';
}

