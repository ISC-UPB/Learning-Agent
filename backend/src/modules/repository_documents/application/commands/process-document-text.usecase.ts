import { Injectable, Logger } from '@nestjs/common';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';
import type { TextExtractionPort } from '../../domain/ports/text-extraction.port';
import type { DocumentStoragePort } from '../../domain/ports/document-storage.port';
import { DocumentStatus } from '../../domain/entities/document.entity';
import { DocumentService } from '../../domain/services/document.service';

@Injectable()
export class ProcessDocumentTextUseCase {
  private readonly logger = new Logger(ProcessDocumentTextUseCase.name);

  constructor(
    private readonly documentRepository: DocumentRepositoryPort,
    private readonly textExtraction: TextExtractionPort,
    private readonly storageAdapter: DocumentStoragePort,
  ) {}

  /**
   * Process a document to extract its text
   * @param documentId ID of the document to process
   * @returns true if processed successfully
   */
  async execute(documentId: string): Promise<boolean> {
    try {
      this.logger.log(`Starting document processing: ${documentId}`);

      // 1. Find the document
      const document = await this.documentRepository.findById(documentId);
      if (!document) {
        this.logger.error(`Document not found: ${documentId}`);
        return false;
      }

      // 2. Verify it's in UPLOADED status
      if (!DocumentService.isReadyForProcessing(document)) {
        this.logger.warn(
          `Document ${documentId} is not ready for processing. Status: ${document.status}`,
        );
        return false;
      }

      // 3. Mark as PROCESSING
      await this.documentRepository.updateStatus(
        documentId,
        DocumentStatus.PROCESSING,
      );

      try {
        // 4. Download file from S3
        const fileBuffer = await this.downloadFileFromStorage(document.s3Key);

        // 5. Extract text from PDF
        const extractedText = await this.textExtraction.extractTextFromPdf(
          fileBuffer,
          document.originalName,
        );

        // 6. Update document with extracted text
        await this.documentRepository.updateExtractedText(
          documentId,
          extractedText.content,
          extractedText.pageCount,
          extractedText.documentTitle,
          extractedText.documentAuthor,
          extractedText.language,
        );

        // 7. Mark as PROCESSED
        await this.documentRepository.updateStatus(
          documentId,
          DocumentStatus.PROCESSED,
        );

        this.logger.log(
          `Document ${documentId} processed successfully. ` +
            `Extracted text: ${extractedText.getContentLength()} characters, ` +
            `${extractedText.getWordCount()} words`,
        );

        return true;
      } catch (error) {
        // In case of error, mark document as ERROR
        await this.documentRepository.updateStatus(
          documentId,
          DocumentStatus.ERROR,
        );

        this.logger.error(`Error processing document ${documentId}`);
        throw error;
      }
    } catch {
      this.logger.error(`Error in document processing ${documentId}`);
      return false;
    }
  }

  /**
   * Download a file from storage (S3/MinIO)
   */
  private async downloadFileFromStorage(s3Key: string): Promise<Buffer> {
    try {
      return await this.storageAdapter.downloadFileBuffer(s3Key);
    } catch {
      throw new Error('Failed to download file from storage');
    }
  }
}
