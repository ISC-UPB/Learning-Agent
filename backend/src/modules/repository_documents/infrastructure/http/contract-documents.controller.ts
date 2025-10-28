import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ContextualLoggerService } from '../services/contextual-logger.service';
import { GetDocumentsBySubjectUseCase } from '../../application/queries/get-documents-by-subject.usecase';
import { GetDocumentContentUseCase } from '../../application/queries/get-document-content.usecase';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';
import type { DocumentChunkRepositoryPort } from '../../domain/ports/document-chunk-repository.port';
import {
  DOCUMENT_REPOSITORY_PORT,
  DOCUMENT_CHUNK_REPOSITORY_PORT,
} from '../../tokens';
import {
  ContractDocumentListResponseDto,
  ContractDocumentItemDto,
  DocumentContentResponseDto,
  DocumentContentMetadataDto,
  GetDocumentsBySubjectQueryDto,
} from './dtos/contract-documents.dto';
import {
  DocumentIndex,
  IndexChapter,
  IndexSubtopic,
  IndexStatus,
} from '../../domain/entities/document-index.entity';

/**
 * Controller for contract endpoints with the student module
 * Base URL: /api/v1/documents
 */
@Controller('api/v1/documents')
@UseGuards(AuthGuard('jwt'))
export class ContractDocumentsController {
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly getDocumentsBySubjectUseCase: GetDocumentsBySubjectUseCase,
    private readonly getDocumentContentUseCase: GetDocumentContentUseCase,
    @Inject(DOCUMENT_REPOSITORY_PORT)
    private readonly documentRepository: DocumentRepositoryPort,
    @Inject(DOCUMENT_CHUNK_REPOSITORY_PORT)
    private readonly chunkRepository: DocumentChunkRepositoryPort,
    private readonly configService: ConfigService,
    private readonly logger: ContextualLoggerService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private getMaxOutputTokens(): number {
    return this.configService.get<number>('GEMINI_MAX_OUTPUT_TOKENS') || 512;
  }

  @Get('subject/:subjectId/documents')
  async getDocumentsBySubject(
    @Param('subjectId') subjectId: string,
    @Query() query: GetDocumentsBySubjectQueryDto,
  ): Promise<ContractDocumentListResponseDto> {
    try {
      this.logger.logDocumentOperation('list', undefined, {
        subjectId,
        query,
      });

      if (!subjectId || !subjectId.trim()) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Subject ID is required',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.getDocumentsBySubjectUseCase.execute({
        subjectId: subjectId.trim(),
        tipo: query.tipo,
        page: query.page || 1,
        limit: query.limit || 10,
      });

      const documentos = result.docs.map(
        (doc) =>
          new ContractDocumentItemDto(
            doc.id,
            doc.originalName, // title
            this.extractFileType(doc.mimeType), // type
            doc.downloadUrl, // url
            doc.uploadedAt, // UploadDate
            doc.uploadedBy, // professorId
          ),
      );

      this.logger.log('Documents retrieved successfully for subject', {
        subjectId,
        totalDocuments: result.total,
        documentsReturned: documentos.length,
        page: result.page,
      });

      return new ContractDocumentListResponseDto(
        documentos,
        result.total,
        result.page,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        'Error retrieving documents by subject',
        error instanceof Error ? error : errorMessage,
        {
          subjectId,
          errorType: 'DOCUMENTS_BY_SUBJECT_ERROR',
        },
      );

      if (errorMessage.includes('not found')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Subject not found',
            error: 'Not Found',
            details: errorMessage,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (errorMessage.includes('storage service')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: 'Storage service unavailable',
            error: 'Service Unavailable',
            details: errorMessage,
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Generic error
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error internal server while getting documents',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /documents/{docId}/content
   * Obtain the extracted content of a specific document.
   */
  @Get(':docId/content')
  async getDocumentContent(
    @Param('docId') docId: string,
  ): Promise<DocumentContentResponseDto> {
    try {
      this.logger.logDocumentOperation('download', docId);

      if (!docId || !docId.trim()) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Document ID is required',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verify that the document exists
      const document = await this.documentRepository.findById(docId.trim());
      if (!document) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Document not found',
            error: 'Not Found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // Get all the chunks of the document
      const chunksResult = await this.chunkRepository.findByDocumentId(
        docId.trim(),
        { limit: 10000 },
      );
      if (
        !chunksResult ||
        !chunksResult.chunks ||
        chunksResult.chunks.length === 0
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'No chunks found for the document',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const chunks = chunksResult.chunks;
      this.logger.log(`Found ${chunks.length} chunks to process`);

      const documentIndex = await this.generateDocumentIndex(
        docId.trim(),
        document.documentTitle || document.originalName,
        chunks,
      );

      const formattedIndex = this.formatIndexAsString(documentIndex);

      const summary = this.generateSummaryFromChunks(chunks);

      const pageCount = document.pageCount || Math.ceil(chunks.length / 2) || 1;

      return new DocumentContentResponseDto(
        formattedIndex,
        new DocumentContentMetadataDto(pageCount, summary),
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        'Error generating document index',
        error instanceof Error ? error : errorMessage,
        {
          docId,
          errorType: 'DOCUMENT_INDEX_ERROR',
        },
      );

      if (errorMessage.includes('not found')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Document not found',
            error: 'Not Found',
            details: errorMessage,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (errorMessage.includes('chunks')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'The document does not have processed content',
            error: 'Bad Request',
            details: errorMessage,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Generic error
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error while generating index',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate the document index using Gemini AI with a fallback option
   */
  private async generateDocumentIndex(
    documentId: string,
    documentTitle: string,
    chunks: any[],
  ): Promise<DocumentIndex> {
    try {
      this.logger.log(`Generating index for document: ${documentTitle}`);
      this.logger.log(`Processing all ${chunks.length} chunks in batches`);

      // Process all chunks in small batches
      const batchSize = 50;
      const allChapters: IndexChapter[] = [];

      const sortedChunks = chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

      for (let i = 0; i < sortedChunks.length; i += batchSize) {
        const batch = sortedChunks.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(sortedChunks.length / batchSize);

        this.logger.log(
          `Processing batch ${batchNumber}/${totalBatches} (${batch.length} chunks)`,
        );

        try {
          const batchChapters = await this.processBatch(
            batch,
            documentTitle,
            batchNumber,
            totalBatches,
          );

          allChapters.push(...batchChapters);

          if (i + batchSize < sortedChunks.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (batchError) {
          this.logger.warn(`Error in batch ${batchNumber}, using fallback:`, {
            error:
              batchError instanceof Error
                ? batchError.message
                : String(batchError),
            batchNumber,
          });

          const fallbackChapters = this.generateFallbackChaptersForBatch(
            batch,
            batchNumber,
          );
          allChapters.push(...fallbackChapters);
        }
      }

      const documentIndex = new DocumentIndex(
        this.generateId(),
        documentId,
        documentTitle,
        allChapters,
        new Date(),
        IndexStatus.GENERATED,
      );

      this.logger.log(
        `Index generated with ${documentIndex.chapters.length} chapters from ${chunks.length} chunks`,
      );

      return documentIndex;
    } catch (error) {
      this.logger.error(
        'Error generating index with Gemini:',
        error instanceof Error ? error : String(error),
      );

      return this.generateFallbackIndex(documentId, documentTitle, chunks);
    }
  }

  /**
   * Processes a batch of chunks with Gemini AI
   */
  private async processBatch(
    batch: any[],
    documentTitle: string,
    batchNumber: number,
    totalBatches: number,
  ): Promise<IndexChapter[]> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: this.getMaxOutputTokens(), // Made configurable via GEMINI_MAX_OUTPUT_TOKENS env var
      },
    });

    const batchText = batch.map((chunk) => chunk.content).join('\n\n');

    const prompt = this.buildBatchPrompt(
      documentTitle,
      batchText,
      batchNumber,
      totalBatches,
    );

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Timeout: The model took too much time.')),
        45000,
      ),
    );

    const generation = model.generateContent(prompt);

    try {
      const result = await Promise.race([generation, timeout]);
      const response = result.response;
      const text = response.text();

      if (text.length > 25000) {
        this.logger.warn(
          `Response too long (${text.length} chars), truncating...`,
        );
        const truncatedText = text.substring(0, 25000);
        const lastBrace = truncatedText.lastIndexOf('}');
        if (lastBrace > 0) {
          const validJson = truncatedText.substring(0, lastBrace + 1);
          const batchData: any = this.parseGeminiResponse(validJson);
          return (
            batchData.chapters?.map((chapter: any) =>
              this.mapChapter(chapter),
            ) || []
          );
        }
      }

      const batchData: any = this.parseGeminiResponse(text);
      return (
        batchData.chapters?.map((chapter: any) => this.mapChapter(chapter)) ||
        []
      );
    } catch (error) {
      this.logger.error(
        'Error in contract generation:',
        error instanceof Error ? error : String(error),
      );
      return [];
    }
  }

  /**
   * Generates basic chapters for a batch when the AI ​​fails.
   */
  private generateFallbackChaptersForBatch(
    batch: any[],
    batchNumber: number,
  ): IndexChapter[] {
    const chapters: IndexChapter[] = [];
    const chunksPerChapter = 10;

    for (let i = 0; i < batch.length; i += chunksPerChapter) {
      const chapterChunks = batch.slice(i, i + chunksPerChapter);
      const chapterNumber = Math.floor(i / chunksPerChapter) + 1;

      // Extract keywords from the first chunk
      const firstChunkContent: string = chapterChunks[0]?.content || '';
      const words: string[] = firstChunkContent
        .split(' ')
        .filter((w) => w.length > 5)
        .slice(0, 3);

      const chapterTitle: string =
        words.length > 0
          ? `Batch ${batchNumber} - Section ${chapterNumber}: ${words.join(', ')}`
          : `Batch ${batchNumber} - Section ${chapterNumber}`;

      // Create basic subtopics
      const subtopics: IndexSubtopic[] = chapterChunks
        .slice(0, 3)
        .map((chunk, idx) => {
          const content: string = chunk.content || '';
          const firstWords: string = content.split(' ').slice(0, 4).join(' ');
          return new IndexSubtopic(
            `${batchNumber}.${chapterNumber}.${idx + 1} ${firstWords || 'Content'}`,
            '',
            [],
          );
        });

      chapters.push(new IndexChapter(chapterTitle, '', subtopics, []));
    }

    return chapters;
  }

  /**
   * Generates a basic index when AI is not available
   */
  private generateFallbackIndex(
    documentId: string,
    documentTitle: string,
    chunks: any[],
  ): DocumentIndex {
    this.logger.log('Generating fallback index without AI');

    const chapters: IndexChapter[] = [];
    const chunkGroups = Math.ceil(chunks.length / 10);

    for (let i = 0; i < chunkGroups; i++) {
      const startChunk = i * 10;
      const endChunk = Math.min((i + 1) * 10, chunks.length);
      const groupChunks = chunks.slice(startChunk, endChunk);

      const firstChunkContent: string = groupChunks[0]?.content || '';
      const words: string[] = firstChunkContent
        .split(' ')
        .filter((w) => w.length > 5)
        .slice(0, 3);
      const chapterTitle: string =
        words.length > 0
          ? `Section ${i + 1}: ${words.join(', ')}`
          : `Section ${i + 1}`;

      // Create basic subtopics
      const subtopics: IndexSubtopic[] = groupChunks
        .slice(0, 3)
        .map((chunk, idx) => {
          const content: string = chunk.content || '';
          const firstWords: string = content.split(' ').slice(0, 4).join(' ');
          return new IndexSubtopic(
            `${i + 1}.${idx + 1} ${firstWords || 'Content'}`,
            '',
            [],
          );
        });

      chapters.push(new IndexChapter(chapterTitle, '', subtopics, []));
    }

    return new DocumentIndex(
      this.generateId(),
      documentId,
      documentTitle,
      chapters,
      new Date(),
      IndexStatus.GENERATED,
    );
  }

  /**
   * Create the prompt for a specific batch
   */
  private buildBatchPrompt(
    documentTitle: string,
    batchText: string,
    batchNumber: number,
    totalBatches: number,
  ): string {
    return `
Analyze the content and generate a VERY SIMPLE INDEX.

DOCUMENT: "${documentTitle}"
BATCH: ${batchNumber} of ${totalBatches}

CONTENT:
${batchText}

STRICT RULES:
1. MAXIMUM 1 chapter per batch
2. MAXIMUM 1 subtopic per chapter
3. VERY brief titles (maximum 20 characters)
4. NO long descriptions
5. JSON maximum 10 lines TOTAL
6. IF the document is large, create VERY basic index
7. NEVER exceed 10 lines of JSON

Respond ONLY with this compact JSON:
{
  "title": "Brief",
  "chapters": [
    {
      "title": "Ch1",
      "description": "",
      "subtopics": [
        {"title": "Sub1", "description": ""}
      ]
    }
  ]
}
`;
  }

  /**
   * Parse Gemini's response
   */
  private parseGeminiResponse(response: string): any {
    try {
      let cleanResponse = response.trim();

      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}') + 1;

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON was found in the response');
      }

      cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);

      return JSON.parse(cleanResponse);
    } catch (error) {
      this.logger.error(
        'Error parsing Gemini response:',
        error instanceof Error ? error.message : String(error),
      );
      this.logger.error('Response received:', response);
      throw new Error("Gemini's response is not valid JSON.");
    }
  }

  /**
   * Map a chapter based on Gemini's response
   */
  private mapChapter(chapterData: any): IndexChapter {
    const subtopics = (chapterData.subtopics || []).map((subtopic: any) =>
      this.mapSubtopic(subtopic),
    );

    return new IndexChapter(chapterData.title, '', subtopics, []);
  }

  /**
   * Map a subtopic from Gemini's response
   */
  private mapSubtopic(subtopicData: any): IndexSubtopic {
    return new IndexSubtopic(subtopicData.title || 'Specific content', '', []);
  }

  /**
   * Generate a short summary based on the document chunks
   */
  private generateSummaryFromChunks(chunks: any[]): string {
    try {
      const firstChunks = chunks.slice(0, 3);
      const combinedContent = firstChunks
        .map((chunk) => (chunk.content || chunk.text || '') as string)
        .join(' ')
        .substring(0, 1000);

      if (!combinedContent.trim()) {
        return 'Specialized technical document';
      }

      const sentences = combinedContent
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 20);
      const words = combinedContent
        .split(' ')
        .filter((word) => word.length > 4);

      if (sentences.length >= 2) {
        const summary = sentences.slice(0, 2).join('. ').trim();
        if (summary.length > 50 && summary.length < 300) {
          return summary + (summary.endsWith('.') ? '' : '.');
        }
      }

      if (sentences.length >= 1) {
        const firstSentence = sentences[0].trim();
        if (firstSentence.length > 30 && firstSentence.length < 200) {
          return firstSentence + (firstSentence.endsWith('.') ? '' : '.');
        }
      }

      const keyWords = words.slice(0, 3).join(', ');
      return `Specialized technical document that addresses topics related to ${keyWords || 'advanced methodologies'}.`;
    } catch (error) {
      this.logger.warn('Error generating summary from chunks', {
        error: String(error),
      });
      return 'Specialized technical document';
    }
  }

  /**
   * Format the index as a numbered string (1.1, 1.2, 2.1, etc.)
   */
  private formatIndexAsString(documentIndex: DocumentIndex): string {
    let result = `INDEX OF DOCUMENT: ${documentIndex.title}\n\n`;

    documentIndex.chapters.forEach((chapter, chapterIndex) => {
      const chapterNumber = chapterIndex + 1;

      result += `${chapterNumber}. ${chapter.title}\n\n`;

      chapter.subtopics.forEach((subtopic, subtopicIndex) => {
        const subtopicNumber = subtopicIndex + 1;
        result += `${chapterNumber}.${subtopicNumber} ${subtopic.title}\n`;
      });

      result += `\n`;
    });

    return result;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `idx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extracts the file type from the mimeType to comply with the contract

   */
  private extractFileType(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word')) return 'document';
    if (mimeType.includes('text')) return 'text';
    return 'document';
  }
}
