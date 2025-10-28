
import {
  IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID,
  Max, MaxLength, Min, ValidateNested
} from 'class-validator';

import { Type } from 'class-transformer';

class DistributionDTO {
  @IsOptional() @IsInt() @Min(0) @Max(999) multiple_choice!: number;
  @IsOptional() @IsInt() @Min(0) @Max(999) true_false!: number;
  @IsOptional() @IsInt() @Min(0) @Max(999) open_analysis!: number;
  @IsOptional() @IsInt() @Min(0) @Max(999) open_exercise!: number;
}

export class CreateExamDto {

  @IsString({ message: 'title debe ser texto' })
  @IsNotEmpty({ message: 'title es obligatorio' })
  @MaxLength(120)
  title!: string;

  @IsUUID('4', { message: 'classId debe ser UUID v4' })

  classId!: string;

  @IsString()
  @IsNotEmpty({ message: 'subject es obligatorio' })
  @MaxLength(200)
  subject!: string;

  @IsString()
  @IsNotEmpty({ message: 'difficulty es obligatorio' })
  difficulty!: string;

  @IsInt()
  @Min(1) @Max(10)
  attempts!: number;

  @IsInt()
  @Min(1) @Max(1000)
  totalQuestions!: number;

  @IsInt()
  @Min(45, { message: 'Mínimo 45 minutos' })
  @Max(240, { message: 'Máximo 240 minutos' })
  timeMinutes!: number;

  @IsOptional() @IsString() @MaxLength(2000)
  reference?: string | null;

  @IsOptional() @ValidateNested() @Type(() => DistributionDTO)
  distribution?: DistributionDTO;

  @IsOptional()
  @IsEnum(['Guardado', 'Publicado'] as const, {
    message: 'status debe ser Guardado o Publicado'
  })
  status?: 'Guardado' | 'Publicado';
}
