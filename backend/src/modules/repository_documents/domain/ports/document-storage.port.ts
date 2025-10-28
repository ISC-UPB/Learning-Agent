import { Document } from '../entities/document.entity';
import {
  UploadDocumentRequest,
  DocumentListItem,
} from '../value-objects/upload-document.vo';

export interface DocumentStoragePort {
  uploadDocument(req: UploadDocumentRequest): Promise<Document>;
  generateDownloadUrl(fileName: string): Promise<string>;
  listDocuments(): Promise<DocumentListItem[]>;
  documentExists(fileName: string): Promise<boolean>;
  softDeleteDocument(fileName: string): Promise<void>;
  deleteFile(fileName: string, isRollback?: boolean): Promise<void>;

  /**
   * Download the content of a file as a Buffer
   * @param fileName File name or S3 key
   * @returns Buffer with the file content
   */
  downloadFileBuffer(fileName: string): Promise<Buffer>;

  /**
   * Verifies if a file exists in the storage
   * @param s3Key S3 key of the file
   * @returns true if the file exists
   */
  exists(s3Key: string): Promise<boolean>;

  /**
   * Moves a file from one location to another in the storage
   * @param sourceKey S3 key of the source file
   * @param destinationKey S3 key of the destination file
   */
  moveFile(sourceKey: string, destinationKey: string): Promise<void>;
}
