import { ExtractedText } from '../value-objects/extracted-text.vo';

export interface TextExtractionPort {
  /**
   * Extracts text from a PDF file
   * @param fileBuffer Buffer of the PDF file
   * @param fileName Original file name
   * @returns Extracted text with metadata
   */
  extractTextFromPdf(
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<ExtractedText>;

  /**
   * Validates if the file is valid for extraction
   * @param fileBuffer Buffer of the file
   * @param mimeType MIME type of the file
   * @returns true if valid for extraction
   */
  isValidForExtraction(fileBuffer: Buffer, mimeType: string): Promise<boolean>;

  /**
   * Gets basic information about the PDF without extracting the entire text
   * @param fileBuffer Buffer of the PDF file
   * @returns Basic metadata of the PDF
   */
  getPdfInfo(fileBuffer: Buffer): Promise<{
    pageCount: number;
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  }>;
}
