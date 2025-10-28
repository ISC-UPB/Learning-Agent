import { IsNotEmpty, IsString } from 'class-validator';

export class ChatRequest {
  @IsNotEmpty({ message: 'La pregunta es obligatoria' })
  @IsString({ message: 'La pregunta debe ser texto' })
  question!: string;
  @IsNotEmpty({ message: 'id de estudiante obligatorio' })
  @IsString({ message: 'id de estudiante debe ser texto' })
  studentId: string;
  @IsNotEmpty({ message: 'id de documento obligatorio' })
  @IsString({ message: 'id de documento debe ser texto' })
  docId: string;
}
