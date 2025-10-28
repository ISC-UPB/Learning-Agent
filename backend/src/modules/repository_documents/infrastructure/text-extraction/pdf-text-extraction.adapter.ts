import { Injectable, Logger } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import { TextExtractionPort } from '../../domain/ports/text-extraction.port';
import { ExtractedText } from '../../domain/value-objects/extracted-text.vo';

@Injectable()
export class PdfTextExtractionAdapter implements TextExtractionPort {
  private readonly logger = new Logger(PdfTextExtractionAdapter.name);

  /**
   * Extract text from a PDF file
   */
  async extractTextFromPdf(
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<ExtractedText> {
    try {
      this.logger.log(`Starting text extraction for: ${fileName}`);

      // Validate that it's a valid PDF
      await this.validatePdfBuffer(fileBuffer);

      // Extract text using pdf-parse
      const pdfData = await pdfParse(fileBuffer, {
        max: 0, // No page limit
        pagerender: this.renderPage,
      });

      // Clean and process extracted text
      const cleanedText = this.cleanExtractedText(pdfData.text);

      // Extract PDF metadata
      const metadata = this.extractMetadata(pdfData, fileName);

      this.logger.log(
        `Text extracted successfully. Pages: ${pdfData.numpages}, Characters: ${cleanedText.length}`,
      );

      return new ExtractedText(
        cleanedText,
        pdfData.numpages,
        metadata.title,
        metadata.author,
        metadata.language,
        {
          fileName,
          extractionTimestamp: new Date().toISOString(),
          pdfInfo: pdfData.info,
          pdfMetadata: pdfData.metadata,
          wordCount: this.countWords(cleanedText),
        },
      );
    } catch (error) {
      this.logger.error(
        `Error extracting text from ${fileName}: ${error.message}`,
      );
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Verify if the file is valid for extraction
   */
  async isValidForExtraction(
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<boolean> {
    try {
      // Verify MIME type
      if (mimeType !== 'application/pdf') {
        return false;
      }

      // Verify PDF header
      return this.validatePdfBuffer(fileBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Get basic PDF information without extracting all text
   */
  async getPdfInfo(fileBuffer: Buffer): Promise<{
    pageCount: number;
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  }> {
    try {
      await this.validatePdfBuffer(fileBuffer);

      const pdfData = await pdfParse(fileBuffer, {
        max: 1, // Only first page for metadata
      });

      return {
        pageCount: pdfData.numpages,
        title: pdfData.info?.Title || undefined,
        author: pdfData.info?.Author || undefined,
        subject: pdfData.info?.Subject || undefined,
        creator: pdfData.info?.Creator || undefined,
      };
    } catch (error) {
      throw new Error(`Failed to get PDF info: ${error.message}`);
    }
  }

  /**
   * Validate that the buffer contains a valid PDF
   */
  private async validatePdfBuffer(fileBuffer: Buffer): Promise<boolean> {
    // Verify minimum size
    if (fileBuffer.length < 100) {
      throw new Error('File too small to be a valid PDF');
    }

    // Verify PDF header (%PDF-)
    const header = fileBuffer.subarray(0, 8).toString();
    if (!header.startsWith('%PDF-')) {
      throw new Error('Invalid PDF header');
    }

    // Verify that it ends with %%EOF or similar
    const tail = fileBuffer.subarray(-1024).toString();
    if (!tail.includes('%%EOF') && !tail.includes('endobj')) {
      this.logger.warn('PDF might be incomplete or corrupted');
    }

    return true;
  }

  /**
   * Custom function to render pages
   */
  private renderPage = (pageData: any) => {
    // Function to process the content of each page
    let renderOptions = {
      normalizeWhitespace: false,
      disableCombineTextItems: false,
    };

    return pageData.getTextContent(renderOptions).then((textContent: any) => {
      let lastY: number | undefined;
      let text = '';

      for (let item of textContent.items) {
        if (lastY === item.transform[5] || !lastY) {
          text += item.str;
        } else {
          text += '\n' + item.str;
        }
        lastY = item.transform[5];
      }

      return text;
    });
  };

  /**
   * Clean and normalize the extracted text
   */
  private cleanExtractedText(rawText: string): string {
    return (
      rawText
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Remove control characters
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Normalize line breaks
        .replace(/\n\s*\n/g, '\n\n')
        // Remove leading and trailing spaces
        .trim()
    );
  }

  /**
   * Extract metadata from the PDF
   */
  private extractMetadata(
    pdfData: any,
    fileName: string,
  ): {
    title?: string;
    author?: string;
    language?: string;
  } {
    const info = pdfData.info || {};
    const metadata = pdfData.metadata || {};

    // Try to extract title
    let title = info.Title || metadata.Title;
    if (!title || title.trim().length === 0) {
      // Use file name as title if no title in metadata
      title = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    }

    // Extract author
    const author = info.Author || metadata.Author || undefined;

    // Try to detect language (very basic)
    const language = this.detectLanguage(pdfData.text);

    return {
      title: title?.trim(),
      author: author?.trim(),
      language,
    };
  }

  /**
   * Detect the language of the text in a basic way
   */
  private detectLanguage(text: string): string {
    const sample = text.substring(0, 1000).toLowerCase();

    // Common words in Spanish
    const spanishWords = [
      'el',
      'la',
      'de',
      'que',
      'y',
      'en',
      'un',
      'es',
      'se',
      'no',
      'te',
      'lo',
      'le',
      'da',
      'su',
      'por',
      'son',
      'con',
      'para',
      'como',
      'las',
      'pero',
      'sus',
      'una',
      'está',
      'ser',
      'tiene',
    ];

    // Palabras comunes en inglés
    const englishWords = [
      'the',
      'and',
      'is',
      'in',
      'to',
      'of',
      'a',
      'that',
      'it',
      'with',
      'for',
      'as',
      'was',
      'on',
      'are',
      'you',
      'this',
      'be',
      'at',
      'or',
      'have',
      'from',
      'an',
      'they',
      'which',
      'one',
      'had',
      'by',
    ];

    let spanishCount = 0;
    let englishCount = 0;

    spanishWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = sample.match(regex);
      if (matches) spanishCount += matches.length;
    });

    englishWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = sample.match(regex);
      if (matches) englishCount += matches.length;
    });

    return spanishCount > englishCount ? 'es' : 'en';
  }

  /**
   * Count the words in the text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }
}
