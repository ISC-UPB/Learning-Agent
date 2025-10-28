export interface DocumentChunkDto {
  examId?: string;
  documentId: string;
  chunkIndex: number;
  startPosition: number;
  endPosition: number;
  content: string;
  type: 'instruction' | 'reference' | 'question';
  order: number;
  metadata?: Record<string, any>;
}

