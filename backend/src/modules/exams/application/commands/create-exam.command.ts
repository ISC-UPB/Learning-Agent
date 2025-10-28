import { DistributionDto } from '../../infrastructure/http/dtos/distribution.dto';
import { DocumentChunkDto } from '../../infrastructure/http/dtos/document-chunk.dto';

export class CreateExamCommand {
  
  constructor(
    public readonly title: string,
    public readonly classId: string,
    public readonly difficulty: string,
    public readonly attempts: number,
    public readonly timeMinutes: number,
    public readonly teacherId: string,
    public readonly reference?: string | null,
    public readonly status?: 'Guardado' | 'Publicado',
    public readonly distributions?: DistributionDto[],
    public readonly documents?: DocumentChunkDto[],
  ) {}
}
