import {
  Controller,
  Get,
  Delete,
  Post,
  Param,
  Query,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
  Body,
  Req,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../http/middleware/auth.middleware';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ContextualLoggerService } from '../services/contextual-logger.service';
import { ListDocumentsUseCase } from '../../application/queries/list-documents.usecase';
import { DeleteDocumentUseCase } from '../../application/commands/delete-document.usecase';
import { UploadDocumentUseCase } from '../../application/commands/upload-document.usecase';
import { ProcessDocumentTextUseCase } from '../../application/commands/process-document-text.usecase';
import { ProcessDocumentChunksUseCase } from '../../application/commands/process-document-chunks.usecase';
import { CheckDocumentSimilarityUseCase } from '../../application/use-cases/check-document-similarity.usecase';
import { CheckDeletedDocumentUseCase } from '../../application/use-cases/check-deleted-document.usecase';
import { DownloadDocumentUseCase } from '../../application/commands/download-document.usecase';
import { GenerateDocumentIndexUseCase } from '../../application/use-cases/generate-document-index.usecase';
import { GetDocumentIndexUseCase } from '../../application/use-cases/get-document-index.usecase';
import {
  DocumentListResponseDto,
  DocumentListItemDto,
} from './dtos/list-documents.dto';
import { FilterDocumentsDto } from './dtos/filter-documents.dto';
import {
  DeleteDocumentResponseDto,
  DeleteDocumentErrorDto,
} from './dtos/delete-document.dto';
import { CheckDocumentSimilarityRequest } from '../../domain/value-objects/document-similarity-check.vo';
import { CheckDeletedDocumentRequest } from '../../domain/value-objects/deleted-document-check.vo';
import {
  UnifiedUploadResponseDto,
  UnifiedUploadRequestDto,
} from './dtos/unified-upload.dto';
import type {
  GenerateDocumentIndexRequestDto,
  GenerateDocumentIndexResponseDto,
} from './dtos/generate-document-index.dto';

@Controller('api/documents')
export class DocumentsController {
  constructor(
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    private readonly downloadDocumentUseCase: DownloadDocumentUseCase,
    private readonly processDocumentTextUseCase: ProcessDocumentTextUseCase,
    private readonly processDocumentChunksUseCase: ProcessDocumentChunksUseCase,
    private readonly checkDocumentSimilarityUseCase: CheckDocumentSimilarityUseCase,
    private readonly checkDeletedDocumentUseCase: CheckDeletedDocumentUseCase,
    private readonly generateDocumentIndexUseCase: GenerateDocumentIndexUseCase,
    private readonly getDocumentIndexUseCase: GetDocumentIndexUseCase,
    private readonly logger: ContextualLoggerService,
  ) {}

  @Get()
  async listDocuments(
    @Query() filters: FilterDocumentsDto,
  ): Promise<DocumentListResponseDto> {
    try {
      this.logger.logDocumentOperation('list');

      const result = await this.listDocumentsUseCase.execute(filters);

      const documents = result.docs.map(
        (doc) =>
          new DocumentListItemDto(
            doc.id,
            doc.fileName,
            doc.originalName,
            doc.mimeType,
            doc.size,
            doc.downloadUrl,
            doc.uploadedAt,
            doc.courseId,
            doc.classId,
          ),
      );

      this.logger.log('Documents retrieved successfully', {
        totalDocuments: result.total,
        documentsReturned: documents.length,
        courseId: filters.courseId,
        classId: filters.classId,
      });

      return new DocumentListResponseDto(
        documents,
        result.total,
        'Documents retrieved successfully',
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        'Error retrieving documents',
        error instanceof Error ? error : errorMessage,
        {
          errorType: 'DOCUMENTS_LIST_ERROR',
        },
      );

      if (errorMessage.includes('Document bucket not found')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: 'Storage service temporarily unavailable',
            error: 'Bucket Configuration Error',
            details: errorMessage,
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (errorMessage.includes('Connection error with MinIO')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: 'Storage service temporarily unavailable',
            error: 'Storage Connection Error',
            details: errorMessage,
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error internal server while retrieving documents',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteDocument(
    @Param('id') documentId: string,
  ): Promise<DeleteDocumentResponseDto> {
    try {
      this.logger.logDocumentOperation('delete', documentId);

      const result = await this.deleteDocumentUseCase.execute(documentId);

      if (!result.success) {
        if (result.error === 'DOCUMENT_NOT_FOUND') {
          this.logger.warn('Document not found for deletion', {
            documentId,
            errorType: 'DOCUMENT_NOT_FOUND',
          });

          throw new HttpException(
            new DeleteDocumentErrorDto(
              'Document Not Found',
              result.message,
              documentId,
            ),
            HttpStatus.NOT_FOUND,
          );
        }

        this.logger.error('Document deletion failed', result.message, {
          documentId,
          errorType: result.error,
        });

        throw new HttpException(
          new DeleteDocumentErrorDto(
            'Delete Failed',
            result.message,
            documentId,
          ),
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log('Document deleted successfully', {
        documentId,
        deletedAt: result.deletedAt,
      });

      return new DeleteDocumentResponseDto(
        result.message,
        documentId,
        result.deletedAt!,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        'Unexpected error in deleteDocument',
        error instanceof Error ? error : errorMessage,
        {
          documentId,
          errorType: 'UNEXPECTED_ERROR',
        },
      );

      throw new HttpException(
        new DeleteDocumentErrorDto(
          'Internal Server Error',
          `Error deleting document: ${errorMessage}`,
          documentId,
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        if (file.mimetype !== 'application/pdf') {
          callback(
            new BadRequestException('Only PDF files are allowed'),
            false,
          );
        } else {
          callback(null, true);
        }
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: UnifiedUploadRequestDto,
    @Req() req: AuthenticatedRequest,
    @Body('courseId') courseId?: string,
    @Body('classId') classId?: string,
  ): Promise<UnifiedUploadResponseDto> {
    try {
      this.logger.log('Upload request received:', {
        hasFile: !!file,
        fileInfo: file
          ? {
              originalname: file.originalname,
              size: file.size,
              mimetype: file.mimetype,
              fieldname: file.fieldname,
            }
          : null,
        hasUser: !!req.user,
        userId: req.user?.id,
        headers: req.headers,
      });

      if (!file) {
        throw new BadRequestException('No file provided');
      }

      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      this.logger.log('DATA RECEIVED FROM THE FRONTEND:', {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        optionsRaw: options,
        courseIdFromOptions: options.courseId,
        classIdFromOptions: options.classId,
        courseIdFromBody: courseId,
        classIdFromBody: classId,
        optionsKeys: Object.keys(options),
        formDataReceived: JSON.stringify(options),
      });

      this.logger.setContext({ userId });
      this.logger.logDocumentOperation('upload', undefined, {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      this.logger.setContext({ userId });
      this.logger.logDocumentOperation('upload', undefined, {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        options: options,
      });

      // Check for reusable deleted documents
      this.logger.log('Checking for reusable deleted documents...', {
        fileName: file.originalname,
        fileSize: file.size,
        userId: userId,
        autoRestoreEnabled: true,
      });

      const deletedCheckRequest = new CheckDeletedDocumentRequest(
        file.buffer,
        file.originalname,
        file.mimetype,
        userId,
        {
          skipTextExtraction: false,
          autoRestore: true,
        },
      );

      const deletedResult =
        await this.checkDeletedDocumentUseCase.execute(deletedCheckRequest);

      this.logger.log(
        `Deleted document check result: ${deletedResult.status}`,
        {
          status: deletedResult.status,
          deletedDocumentFound: !!deletedResult.deletedDocument,
          deletedDocumentId: deletedResult.deletedDocument?.id,
          restorationAttempted: !!deletedResult.restoredDocument,
          fileName: file.originalname,
        },
      );

      if (
        deletedResult.status === 'exact_match' ||
        deletedResult.status === 'text_match' ||
        deletedResult.status === 'restored'
      ) {
        const matchType =
          deletedResult.status === 'exact_match'
            ? 'BINARY HASH'
            : deletedResult.status === 'text_match'
              ? 'TEXT HASH'
              : 'RESTORATION';

        this.logger.log(
          `Found reusable deleted document (${matchType}): ${deletedResult.deletedDocument?.id}`,
          {
            matchType: deletedResult.status,
            deletedDocumentId: deletedResult.deletedDocument?.id,
            deletedDocumentName: deletedResult.deletedDocument?.originalName,
            deletedAt: deletedResult.deletedDocument?.updatedAt,
            autoRestoreEnabled: true,
          },
        );

        if (deletedResult.restoredDocument) {
          this.logger.log(
            `Document restored successfully: ${deletedResult.restoredDocument.id}`,
            {
              restoredDocumentId: deletedResult.restoredDocument.id,
              originalName: deletedResult.restoredDocument.originalName,
              fileName: deletedResult.restoredDocument.fileName,
              wasDeletedAt: deletedResult.deletedDocument?.updatedAt,
              restoredAt: deletedResult.restoredDocument.updatedAt,
              matchType: deletedResult.status,
            },
          );
          return new UnifiedUploadResponseDto(
            'restored',
            `Document automatically restored. The file "${file.originalname}" already existed in the system and was restored.`,
            {
              id: deletedResult.restoredDocument.id,
              fileName: deletedResult.restoredDocument.fileName,
              originalName: deletedResult.restoredDocument.originalName,
              mimeType: deletedResult.restoredDocument.mimeType,
              size: deletedResult.restoredDocument.size,
              downloadUrl: deletedResult.restoredDocument.url,
              uploadedAt: deletedResult.restoredDocument.updatedAt,
            },
            undefined,
            undefined,
            true,
            deletedResult.deletedDocument?.updatedAt,
          );
        } else {
          this.logger.warn(`Deleted document found but could not be restored`, {
            deletedDocumentId: deletedResult.deletedDocument?.id,
            status: deletedResult.status,
            fileName: file.originalname,
          });
        }
      } else {
        this.logger.log(
          `No reusable deleted documents found (${deletedResult.status})`,
          {
            status: deletedResult.status,
            fileName: file.originalname,
          },
        );
      }

      // Check for duplicates in active documents
      let preGeneratedChunks: any[] = [];
      let preGeneratedEmbeddings: number[][] = [];
      let extractedText: string = '';

      this.logger.log('Checking for document similarity and duplicates...', {
        fileName: file.originalname,
        fileSize: file.size,
        userId: userId,
        similarityThreshold: options.similarityThreshold || 0.7,
        maxCandidates: options.maxSimilarCandidates || 10,
      });

      const similarityCheckRequest = new CheckDocumentSimilarityRequest(
        file.buffer,
        file.originalname,
        file.mimetype,
        userId,
        {
          skipEmbeddings: false,
          similarityThreshold: options.similarityThreshold || 0.7,
          maxCandidates: options.maxSimilarCandidates || 10,
          useSampling: true,
          returnGeneratedData: true,
        },
      );

      const similarityResult =
        await this.checkDocumentSimilarityUseCase.execute(
          similarityCheckRequest,
        );

      this.logger.log(`Similarity check result: ${similarityResult.status}`, {
        status: similarityResult.status,
        exactMatchFound: !!similarityResult.existingDocument,
        exactMatchId: similarityResult.existingDocument?.id,
        candidatesFound: similarityResult.similarCandidates?.length || 0,
        fileName: file.originalname,
      });

      if (
        similarityResult.status === 'exact_match' &&
        similarityResult.existingDocument
      ) {
        this.logger.warn(
          `Exact duplicate found: ${similarityResult.existingDocument.id}`,
          {
            duplicateId: similarityResult.existingDocument.id,
            duplicateName: similarityResult.existingDocument.originalName,
            matchType: similarityResult.existingDocument.matchType,
            uploadedAt: similarityResult.existingDocument.uploadedAt,
            uploadedBy: similarityResult.existingDocument.uploadedBy,
          },
        );

        return new UnifiedUploadResponseDto(
          'duplicate_found',
          `This file already exists in the system. Match type: ${similarityResult.existingDocument.matchType === 'binary_hash' ? 'Binary hash identical' : 'Text content identical'}.`,
          undefined,
          {
            id: similarityResult.existingDocument.id,
            originalName: similarityResult.existingDocument.originalName,
            documentTitle:
              similarityResult.existingDocument.documentTitle || null,
            documentAuthor:
              similarityResult.existingDocument.documentAuthor || null,
            uploadedAt: similarityResult.existingDocument.uploadedAt,
            uploadedBy: similarityResult.existingDocument.uploadedBy,
            matchType: similarityResult.existingDocument.matchType,
          },
        );
      }

      if (
        similarityResult.status === 'candidates' &&
        similarityResult.similarCandidates &&
        similarityResult.similarCandidates.length > 0
      ) {
        this.logger.log(
          `Found ${similarityResult.similarCandidates.length} similar documents`,
          {
            candidateCount: similarityResult.similarCandidates.length,
            topSimilarity: Math.max(
              ...similarityResult.similarCandidates.map(
                (c) => c.similarityScore,
              ),
            ),
            fileName: file.originalname,
          },
        );

        return new UnifiedUploadResponseDto(
          'similar_found',
          `Found ${similarityResult.similarCandidates.length} similar documents. Check if the document you are trying to upload already exists.`,
          undefined,
          undefined,
          similarityResult.similarCandidates.map((candidate) => ({
            id: candidate.id,
            originalName: candidate.originalName,
            documentTitle: candidate.documentTitle || null,
            documentAuthor: candidate.documentAuthor || null,
            uploadedAt: candidate.uploadedAt,
            uploadedBy: candidate.uploadedBy,
            similarityScore: candidate.similarityScore,
            details: {
              avgSimilarity: candidate.avgSimilarity,
              coverage: candidate.coverage,
              matchedChunks: candidate.matchedChunks,
              totalChunks: candidate.totalChunks,
            },
          })),
        );
      }

      if (similarityResult.generatedData) {
        preGeneratedChunks = similarityResult.generatedData.chunks || [];
        preGeneratedEmbeddings =
          similarityResult.generatedData.embeddings || [];
        extractedText = similarityResult.generatedData.extractedText || '';

        this.logger.log('Reusing generated data from similarity check', {
          chunksGenerated: preGeneratedChunks.length,
          embeddingsGenerated: preGeneratedEmbeddings.length,
          extractedTextLength: extractedText.length,
        });
      }

      this.logger.log(
        `No duplicates or similar documents found, proceeding with upload`,
        { fileName: file.originalname },
      );

      const finalCourseId = courseId || options.courseId;
      const finalClassId = classId || options.classId;

      const document = await this.uploadDocumentUseCase.execute(file, userId, {
        preGeneratedChunks,
        preGeneratedEmbeddings,
        extractedText,
        reuseGeneratedData: preGeneratedChunks.length > 0,
        courseId: finalCourseId,
        classId: finalClassId,
      });

      this.logger.log('Document uploaded successfully', {
        documentId: document.id,
        fileName: document.fileName,
        originalName: document.originalName,
        size: document.size,
        uploadFlow: 'normal_upload_final_success',
        optimizationUsed: preGeneratedChunks.length > 0,
        totalProcessingSteps: 3,
      });

      return new UnifiedUploadResponseDto(
        'uploaded',
        'Document uploaded successfully',
        {
          id: document.id,
          fileName: document.fileName,
          originalName: document.originalName,
          mimeType: document.mimeType,
          size: document.size,
          downloadUrl: document.url,
          uploadedAt: document.uploadedAt,
        },
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        'Unexpected error in unified uploadDocument',
        error instanceof Error ? error : errorMessage,
        {
          fileName: file?.originalname,
          fileSize: file?.size,
          errorType: 'UNIFIED_UPLOAD_ERROR',
        },
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error while processing file',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('download/:id')
  async downloadDocument(
    @Param('id') documentId: string,
  ): Promise<{ downloadUrl: string }> {
    try {
      if (!documentId) {
        throw new BadRequestException('Document ID required');
      }

      this.logger.logDocumentOperation('download', documentId);

      const downloadUrl =
        await this.downloadDocumentUseCase.execute(documentId);

      this.logger.log('Document download URL generated successfully', {
        documentId,
        downloadUrlLength: downloadUrl.length,
      });

      return { downloadUrl };
    } catch (error) {
      if (
        error instanceof HttpException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        'Unexpected error in downloadDocument',
        error instanceof Error ? error : errorMessage,
        {
          documentId,
          errorType: 'DOWNLOAD_ERROR',
        },
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error while generating download URL',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':documentId/process-text')
  async processDocumentText(
    @Param('documentId') documentId: string,
  ): Promise<{ message: string; success: boolean }> {
    try {
      this.logger.logDocumentOperation('process', documentId, {
        operation: 'text_extraction',
      });

      const success = await this.processDocumentTextUseCase.execute(documentId);

      if (success) {
        this.logger.log('Document text processed successfully', {
          documentId,
          operation: 'text_extraction',
        });

        return {
          success: true,
          message: 'Text extracted successfully from document',
        };
      } else {
        this.logger.warn('Document text processing failed', {
          documentId,
          operation: 'text_extraction',
        });

        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Document processing failed',
            error: 'Processing Failed',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        'Unexpected error in processDocumentText',
        error instanceof Error ? error : errorMessage,
        {
          documentId,
          operation: 'text_extraction',
          errorType: 'PROCESSING_ERROR',
        },
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error while processing document',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Processes chunks of a specific document
   */
  @Post(':documentId/process-chunks')
  async processDocumentChunks(
    @Param('documentId') documentId: string,
    @Body()
    body: {
      chunkingConfig?: {
        maxChunkSize?: number;
        overlap?: number;
        respectParagraphs?: boolean;
        respectSentences?: boolean;
        minChunkSize?: number;
      };
      replaceExisting?: boolean;
      chunkType?: string;
    } = {},
  ) {
    try {
      if (!documentId) {
        throw new BadRequestException('Document ID required');
      }

      this.logger.logChunkOperation('process', documentId, undefined, {
        chunkingConfig: body.chunkingConfig,
        replaceExisting: body.replaceExisting,
        chunkType: body.chunkType,
      });

      const result = await this.processDocumentChunksUseCase.execute({
        documentId,
        chunkingConfig: body.chunkingConfig,
        replaceExisting: body.replaceExisting,
        chunkType: body.chunkType,
      });

      if (result.status === 'success') {
        this.logger.logChunkOperation(
          'process',
          documentId,
          result.savedChunks.length,
          {
            processingTimeMs: result.processingTimeMs,
            statistics: result.chunkingResult.statistics,
          },
        );

        return {
          success: true,
          message: 'Chunks processed successfully',
          data: {
            totalChunks: result.savedChunks.length,
            processingTimeMs: result.processingTimeMs,
            statistics: result.chunkingResult.statistics,
          },
        };
      } else {
        this.logger.error(
          'Chunk processing failed',
          JSON.stringify(result.errors),
          {
            documentId,
            operation: 'chunk_processing',
            errors: result.errors,
          },
        );

        return {
          success: false,
          message: 'Error processing chunks',
          errors: result.errors,
        };
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        'Unexpected error in processDocumentChunks',
        error instanceof Error ? error : errorMessage,
        {
          documentId,
          operation: 'chunk_processing',
          errorType: 'CHUNK_PROCESSING_ERROR',
        },
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error while processing chunks',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Gets the chunks of a document
   */
  @Get(':documentId/chunks')
  async getDocumentChunks(@Param('documentId') documentId: string) {
    try {
      if (!documentId) {
        throw new BadRequestException('Document ID required');
      }

      this.logger.logChunkOperation('retrieve', documentId);

      const result =
        await this.processDocumentChunksUseCase[
          'chunkingService'
        ].getDocumentChunks(documentId);

      this.logger.log('Document chunks retrieved successfully', {
        documentId,
        totalChunks: result.total,
        chunksReturned: result.chunks.length,
        statistics: result.statistics,
      });

      return {
        success: true,
        message: 'Chunks retrieved successfully',
        data: {
          chunks: result.chunks.map((chunk) => ({
            id: chunk.id,
            content:
              chunk.content.substring(0, 200) +
              (chunk.content.length > 200 ? '...' : ''),
            chunkIndex: chunk.chunkIndex,
            type: chunk.type,
            contentLength: chunk.content.length,
            metadata: chunk.metadata,
            createdAt: chunk.createdAt,
          })),
          total: result.total,
          statistics: result.statistics,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        'Unexpected error in getDocumentChunks',
        error instanceof Error ? error : errorMessage,
        {
          documentId,
          operation: 'chunk_retrieval',
          errorType: 'CHUNK_RETRIEVAL_ERROR',
        },
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error while retrieving chunks',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generates an index with exercises for a document
   */
  @Post(':documentId/generate-index')
  async generateDocumentIndex(
    @Param('documentId') documentId: string,
    @Body() body?: GenerateDocumentIndexRequestDto,
  ): Promise<GenerateDocumentIndexResponseDto> {
    try {
      if (!documentId) {
        throw new BadRequestException('Document ID required');
      }

      this.logger.log(`Generating index for document: ${documentId}`);

      const result = await this.generateDocumentIndexUseCase.execute({
        documentId,
        config: body,
      });

      this.logger.log(
        `Index generated successfully for document: ${documentId}`,
      );

      return {
        success: true,
        data: {
          id: result.id,
          documentId: result.documentId,
          title: result.title,
          chapters: result.chapters.map((chapter) => ({
            title: chapter.title,
            description: chapter.description,
            subtopics: chapter.subtopics.map((subtopic) => ({
              title: subtopic.title,
              description: subtopic.description,
              exercises: subtopic.exercises.map((exercise) => ({
                type: exercise.type,
                title: exercise.title,
                description: exercise.description,
                difficulty: exercise.difficulty,
                estimatedTime: exercise.estimatedTime,
                keywords: exercise.keywords,
              })),
            })),
            exercises: chapter.exercises.map((exercise) => ({
              type: exercise.type,
              title: exercise.title,
              description: exercise.description,
              difficulty: exercise.difficulty,
              estimatedTime: exercise.estimatedTime,
              keywords: exercise.keywords,
            })),
          })),
          generatedAt: result.generatedAt.toISOString(),
          status: result.status,
        },
        message: 'Index generated successfully',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        'Unexpected error in generateDocumentIndex',
        error instanceof Error ? error : errorMessage,
        {
          documentId,
          operation: 'index_generation',
          errorType: 'INDEX_GENERATION_ERROR',
        },
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error while generating index.',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  /**
   * Gets the saved index of a document
   */
  @Get(':documentId/index')
  async getDocumentIndex(
    @Param('documentId') documentId: string,
  ): Promise<GenerateDocumentIndexResponseDto | { message: string }> {
    try {
      if (!documentId) {
        throw new BadRequestException('Document ID required');
      }

      this.logger.log(`Getting index for document: ${documentId}`);

      const result = await this.getDocumentIndexUseCase.execute({
        documentId,
      });

      if (!result) {
        this.logger.warn(`No index was found for document: ${documentId}`);
        return {
          message: 'No index was found for this document.',
        };
      }

      this.logger.log(
        `Index retrieved successfully for document: ${documentId}`,
      );

      return {
        success: true,
        data: {
          id: result.id,
          documentId: result.documentId,
          title: result.title,
          chapters: result.chapters.map((chapter) => ({
            title: chapter.title,
            description: chapter.description,
            subtopics: chapter.subtopics.map((subtopic) => ({
              title: subtopic.title,
              description: subtopic.description,
              exercises: subtopic.exercises.map((exercise) => ({
                type: exercise.type,
                title: exercise.title,
                description: exercise.description,
                difficulty: exercise.difficulty,
                estimatedTime: exercise.estimatedTime,
                keywords: exercise.keywords,
              })),
            })),
            exercises: chapter.exercises.map((exercise) => ({
              type: exercise.type,
              title: exercise.title,
              description: exercise.description,
              difficulty: exercise.difficulty,
              estimatedTime: exercise.estimatedTime,
              keywords: exercise.keywords,
            })),
          })),
          generatedAt: result.generatedAt.toISOString(),
          status: result.status,
        },
        message: 'Index retrieved successfully',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        'Unexpected error in getDocumentIndex',
        error instanceof Error ? error : errorMessage,
        {
          documentId,
          operation: 'get_index',
          errorType: 'GET_INDEX_ERROR',
        },
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error while retrieving index.',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
