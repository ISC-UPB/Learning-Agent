export enum DocumentStatus {
  PENDING = 'PENDING',
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  ERROR = 'ERROR',
  DELETED = 'DELETED'
}

export class Document {
  constructor(
    public readonly id: string,
    public readonly fileName: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly url: string,
    public readonly s3Key: string,
    public readonly fileHash: string,
    public readonly uploadedBy: string,
    public readonly status: DocumentStatus = DocumentStatus.PENDING,
    public readonly extractedText?: string,
    public readonly textHash?: string,
    public readonly pageCount?: number,
    public readonly documentTitle?: string,
    public readonly documentAuthor?: string,
    public readonly language?: string,
    public readonly courseId?: string,
    public readonly classId?: string,
    public readonly uploadedAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  hasExtractedText(): boolean {
    return !!this.extractedText && !!this.textHash;
  }

  withStatus(status: DocumentStatus): Document {
    return new Document(
      this.id,
      this.fileName,
      this.originalName,
      this.mimeType,
      this.size,
      this.url,
      this.s3Key,
      this.fileHash,
      this.uploadedBy,
      status,
      this.extractedText,
      this.textHash,
      this.pageCount,
      this.documentTitle,
      this.documentAuthor,
      this.language,
      this.courseId,
      this.classId,
      this.uploadedAt,
      this.updatedAt
    );
  }

  withExtractedText(
    text: string,
    hash: string,
    pageCount: number,
    title?: string,
    author?: string,
    language?: string,
  ): Document {
    return new Document(
      this.id,
      this.fileName,
      this.originalName,
      this.mimeType,
      this.size,
      this.url,
      this.s3Key,
      this.fileHash,
      this.uploadedBy,
      this.status,
      text,
      hash,
      pageCount,
      title || this.documentTitle,
      author || this.documentAuthor,
      language || this.language,
      this.courseId,
      this.classId,
      this.uploadedAt,
      this.updatedAt
    );
  }
}