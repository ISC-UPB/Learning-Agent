import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class PatchExamMetaDTO {
  @IsOptional() @IsString({ message: 'title debe ser texto' }) @MaxLength(120)
  title?: string;

  @IsOptional() @IsEnum(['Guardado', 'Publicado'] as const, { message: 'status inválido' })
  status?: 'Guardado' | 'Publicado';

  @IsOptional() @IsUUID('4', { message: 'classId debe ser UUID v4' })
  classId?: string;
}
