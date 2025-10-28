export interface Document {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  uploadedAt: string;
  courseId?: string;
  classId?: string;
}

export interface DocumentListResponse {
  success: boolean;
  data: {
    documents: Document[];
    totalCount: number;
  };
}

export interface UploadResponse {
  success: boolean;
  data: Document;
  status?: 'uploaded' | 'restored' | 'duplicate_found' | 'similar_found';
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  pages?: number;
  fileName?: string;
  fileType?: string;
  uploadDate?: string;
  mimeType?: string;
  size?: number;
  language?: string;
}

export interface DocumentStatistics {
  wordCount: number;
  charCount: number;
  chunkCount: number;
  averageChunkSize?: number;
  minChunkSize?: number;
  maxChunkSize?: number;
  totalContentLength?: number;
}

export interface DocumentChunk {
  id: string;
  content: string;
  chunkIndex: number;
  type: string;
  contentLength: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DocumentExtractedData {
  metadata: DocumentMetadata;
  statistics: DocumentStatistics;
  chunks: DocumentChunk[];
  extractedText?: string;
}
