import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DocumentStoragePort } from '../../domain/ports/document-storage.port';
import { Document } from '../../domain/entities/document.entity';
import {
  UploadDocumentRequest,
  DocumentListItem,
} from '../../domain/value-objects/upload-document.vo';
import { minioConfig } from '../config/minio.config';

@Injectable()
export class S3StorageAdapter implements DocumentStoragePort {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly endpoint: string;

  constructor() {
    this.s3Client = new S3Client({
      region: minioConfig.region,
      endpoint: minioConfig.endpoint,
      credentials: {
        accessKeyId: minioConfig.accessKeyId,
        secretAccessKey: minioConfig.secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO
    });

    this.bucketName = minioConfig.bucketName;
    this.endpoint = minioConfig.endpoint;
  }

  /**
   * Upload a document to MinIO
   * @param req - Document data to upload
   * @returns Created document with metadata
   */
  async uploadDocument(req: UploadDocumentRequest): Promise<Document> {
    try {
      this.logger.debug('MinIO Config:', {
        endpoint: this.endpoint,
        bucketName: this.bucketName,
        region: minioConfig.region,
      });
      this.logger.debug('Upload Request:', {
        originalName: req.originalName,
        mimeType: req.mimeType,
        size: req.size,
      });

      // Generate unique file name
      const fileName = this.generateFileName(req.originalName);

      // Configure upload command
      const putObjectCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: req.file,
        ContentType: req.mimeType,
        ContentLength: req.size,
        Metadata: {
          originalName: req.originalName,
          uploadDate: new Date().toISOString(),
        },
      });
      // Upload file to MinIO with error handling
      try {
        await this.s3Client.send(putObjectCommand);
      } catch (storageError) {
        this.logger.error(`Failed to upload file to storage: ${storageError.message}`);
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }
      
      const url = `${this.endpoint}/${this.bucketName}/${fileName}`;
      this.logger.log(`Document uploaded successfully to ${url}`);
      // Create Document entity (simple version for compatibility)
      const document = new Document(
        '', // id - it will be assigned based on the use case
        fileName,
        req.originalName,
        req.mimeType,
        req.size,
        url,
        fileName, // s3Key
        '', // fileHash - it will be assigned based on the use case
        '', // uploadedBy - it will be assigned based on the use case
      );

      return document;
    } catch (error) {
      throw new Error(
        `Error uploading document to MinIO: ${error.message || error}`,
      );
    }
  }

  /**
   * Generate a signed URL for downloading a document
   * @param fileName - File name in MinIO
   * @returns Signed URL valid for 1 hour
   */
  async generateDownloadUrl(fileName: string): Promise<string> {
    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      // Generate signed URL valid for 1 hour
      const signedUrl = await getSignedUrl(this.s3Client, getObjectCommand, {
        expiresIn: 3600,
      });

      return signedUrl;
    } catch (error) {
      throw new Error(
        `Error generating download URL: ${error.message || error}`,
      );
    }
  }

  /**
   * List all documents stored in MinIO
   * @returns Array of documents with basic metadata
   */
  async listDocuments(): Promise<DocumentListItem[]> {
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucketName,
      });

      const response = await this.s3Client.send(listCommand);
      if (!response.Contents || response.Contents.length === 0) {
        return [];
      }

      // Map S3 objects to DocumentListItem
      const documents: DocumentListItem[] = [];

      for (const object of response.Contents) {
        if (!object.Key) continue;
        if (!object.Key.toLowerCase().endsWith('.pdf')) continue; // Filter only PDFs

        try {
          const metadata = await this.s3Client.send(
            new HeadObjectCommand({
              Bucket: this.bucketName,
              Key: object.Key,
            }),
          );

          if (metadata.ContentType !== 'application/pdf') continue;

          const downloadUrl = await this.generateDownloadUrl(object.Key);

          // Extract the original name using the name parser or metadata
          const parsedInfo = this.parseFileName(object.Key);
          const originalName =
            metadata.Metadata?.originalName ||
            parsedInfo?.originalName ||
            object.Key;

          documents.push(
            new DocumentListItem(
              object.Key, // Use the fileName as temporary id
              object.Key,
              originalName,
              metadata.ContentType || 'application/pdf',
              metadata.ContentLength || 0,
              downloadUrl,
              metadata.LastModified || new Date(),
            ),
          );
        } catch {
          this.logger.error(`Error fetching metadata for ${object.Key}`);
        }
      }

      return documents;
    } catch {
      throw new Error('Error listing documents from MinIO');
    }
  }

  /**
   * Generate a unique file name combining timestamp, UUID, and original name
   * @param originalFileName - Original file name
   * @returns Unique file name for MinIO with format: timestamp_uuid_originalName.pdf
   */
  private generateFileName(originalFileName: string): string {
    const timestamp = Date.now();
    const uniqueId = randomUUID();

    // Extract the file extension
    const extension = originalFileName.split('.').pop()?.toLowerCase() || 'pdf';

    // Sanitize the original name
    const baseName = originalFileName
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters
      .substring(0, 50); // Limit length

    // Generate unique name: timestamp_uuid_originalName.extension (without folder)
    const uniqueFileName = `${timestamp}_${uniqueId}_${baseName}.${extension}`;

    return uniqueFileName;
  }

  /**
   * Extract information from the generated file name
   * @param fileName - Generated file name (e.g: 1234567890_uuid_documento.pdf)
   * @returns Object with timestamp, uuid, original name, and extension
   */
  private parseFileName(fileName: string): {
    timestamp: number;
    uuid: string;
    originalName: string;
    extension: string;
  } | null {
    try {
      // Without documents/ folder, search directly for the pattern
      const match = fileName.match(/^(\d+)_([a-f0-9-]+)_(.+)\.([^.]+)$/);

      if (!match) {
        return null;
      }

      const [, timestampStr, uuid, originalName, extension] = match;

      return {
        timestamp: parseInt(timestampStr, 10),
        uuid,
        originalName: originalName.replace(/_/g, ' '),
        extension,
      };
    } catch {
      return null;
    }
  }

  /**
   * Verify if a file exists in MinIO
   * @param fileName - File name to verify
   * @returns true if exists, false if not
   */
  async fileExists(fileName: string): Promise<boolean> {
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      await this.s3Client.send(headCommand);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify if a document exists in MinIO
   * @param fileName - File name to verify
   * @returns true if the file exists, false otherwise
   */
  async documentExists(fileName: string): Promise<boolean> {
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      await this.s3Client.send(headCommand);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Perform a soft delete by moving the file to the deleted/ folder
   * @param fileName - File name to move
   */
  async softDeleteDocument(fileName: string): Promise<void> {
    try {
      const deletedFileName = `deleted/${fileName}`;

      // Copy the file to the deleted/ folder.
      const copyCommand = new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${fileName}`,
        Key: deletedFileName,
      });

      await this.s3Client.send(copyCommand);

      // Delete the original file
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      await this.s3Client.send(deleteCommand);
    } catch {
      throw new Error('Error performing soft delete');
    }
  }

  /**
   * Delete a file from MinIO. Used for rollback in case of database errors.
   * @param fileName - File name to delete
   * @param isRollback - If true, indicates this is a rollback operation
   */
  async deleteFile(fileName: string, isRollback: boolean = false): Promise<void> {
    try {
      this.logger.debug(`${isRollback ? 'Rolling back' : 'Deleting'} file ${fileName} from storage`);
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      await this.s3Client.send(deleteCommand);
    } catch {
      throw new Error('Error deleting file from MinIO');
    }
  }

  /**
   * Download the content of a file as a Buffer
   * @param fileName File name or S3 key
   * @returns Buffer with the file content
   */
  async downloadFileBuffer(fileName: string): Promise<Buffer> {
    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      const response = await this.s3Client.send(getObjectCommand);

      if (!response.Body) {
        throw new Error('File content is empty');
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      const stream = response.Body as any;

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      throw new Error(`Error downloading file from MinIO: ${error.message}`);
    }
  }

  /**
   * Verify if a file exists in the storage
   * @param s3Key S3 key of the file
   * @returns true if the file exists
   */
  async exists(s3Key: string): Promise<boolean> {
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(headCommand);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Move a file from one location to another in the storage
   * @param sourceKey S3 key of the source file
   * @param destinationKey S3 key of the destination file
   */
  async moveFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      // Copy the file to the new location
      const copyCommand = new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
      });

      await this.s3Client.send(copyCommand);

      // Delete the original file
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: sourceKey,
      });

      await this.s3Client.send(deleteCommand);
    } catch (error) {
      throw new Error(
        `error moving file from ${sourceKey} to ${destinationKey}: ${error.message}`,
      );
    }
  }
}
