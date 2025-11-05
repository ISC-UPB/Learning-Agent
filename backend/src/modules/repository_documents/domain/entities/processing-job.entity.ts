export class ProcessingJob {
  constructor(
    public readonly id: string,
    public readonly documentId: string,
    public readonly jobType: ProcessingType,
    public readonly status: ProcessingStatus = ProcessingStatus.PENDING,
    public readonly progress: number = 0,
    public readonly attemptCount: number = 0,
    public readonly errorMessage?: string,
    public readonly jobDetails?: Record<string, any>,
    public readonly result?: Record<string, any>,
    public readonly lastProcessedChunkIndex?: number,
    public readonly processedChunksCount: number = 0,
    public readonly processedEmbeddingsCount: number = 0,
    public readonly startedAt?: Date,
    public readonly completedAt?: Date,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}

export enum ProcessingType {
  TEXT_EXTRACTION = 'TEXT_EXTRACTION',
  CHUNKING = 'CHUNKING',
  EMBEDDING_GENERATION = 'EMBEDDING_GENERATION',
  FULL_PROCESSING = 'FULL_PROCESSING',
  REPROCESSING = 'REPROCESSING',
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  RETRYING = 'RETRYING',
}
