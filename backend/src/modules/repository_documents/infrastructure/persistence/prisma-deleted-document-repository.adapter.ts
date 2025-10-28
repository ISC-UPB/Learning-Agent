import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { DeletedDocumentRepositoryPort } from '../../domain/ports/deleted-document-repository.port';
import {
  Document,
  DocumentStatus,
} from '../../domain/entities/document.entity';

@Injectable()
export class PrismaDeletedDocumentRepositoryAdapter
  implements DeletedDocumentRepositoryPort
{
  private readonly logger = new Logger(
    PrismaDeletedDocumentRepositoryAdapter.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  async findDeletedByFileHash(fileHash: string): Promise<Document | undefined> {
    try {
      this.logger.log(`searching for deleted document with hash: ${fileHash}`);

      // Search all DELETED documents for debugging
      const allDeletedDocs = await this.prisma.document.findMany({
        where: {
          status: 'DELETED',
        },
        select: {
          id: true,
          originalName: true,
          fileHash: true,
        },
      });

      this.logger.log(
        `deleted documents in DB: ${JSON.stringify(allDeletedDocs, null, 2)}`,
      );

      const document = await this.prisma.document.findFirst({
        where: {
          fileHash,
          status: 'DELETED',
        },
      });

      this.logger.log(
        `search result by hash: ${document ? `found document ${document.id}` : 'not found'}`,
      );

      return document ? this.mapToDomain(document) : undefined;
    } catch (error) {
      this.logger.error(
        `error searching deleted document by hash ${fileHash}: ${error.message}`,
      );
      throw new Error(
        `failed to search deleted document by hash: ${error.message}`,
      );
    }
  }

  async findDeletedByTextHash(textHash: string): Promise<Document | undefined> {
    try {
      const document = await this.prisma.document.findFirst({
        where: {
          textHash,
          status: 'DELETED',
        },
      });

      return document ? this.mapToDomain(document) : undefined;
    } catch (error) {
      this.logger.error(
        `error searching deleted document by text hash ${textHash}: ${error.message}`,
      );
      throw new Error(
        `The search for deleted document by text hash failed.: ${error.message}`,
      );
    }
  }

  async findSimilarDeletedDocuments(
    fileHash?: string,
    textHash?: string,
  ): Promise<Document[]> {
    try {
      const whereConditions: any = {
        status: 'DELETED',
      };

      if (fileHash || textHash) {
        whereConditions.OR = [];
        if (fileHash) {
          whereConditions.OR.push({ fileHash });
        }
        if (textHash) {
          whereConditions.OR.push({ textHash });
        }
      }

      const documents = await this.prisma.document.findMany({
        where: whereConditions,
        orderBy: { updatedAt: 'desc' },
        take: 10,
      });

      return documents.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      this.logger.error(
        `error searching similar deleted documents: ${error.message}`,
      );
      throw new Error(
        `The search for similar deleted documents failed.: ${error.message}`,
      );
    }
  }

  async restoreDocument(documentId: string): Promise<Document | undefined> {
    try {
      const restoredDocument = await this.prisma.document.update({
        where: {
          id: documentId,
          status: 'DELETED', // only restore if it is marked as deleted
        },
        data: {
          status: 'UPLOADED', // change status to uploaded for reprocessing
          updatedAt: new Date(),
        },
      });

      this.logger.log(`restored document: ${documentId}`);
      return this.mapToDomain(restoredDocument);
    } catch (error) {
      if (error.code === 'P2025') {
        this.logger.warn(`Document not found or not deleted: ${documentId}`);
        return undefined;
      }
      this.logger.error(
        `error restoring document ${documentId}: ${error.message}`,
      );
      throw new Error(`The document restoration failed.: ${error.message}`);
    }
  }

  async findAllDeleted(offset = 0, limit = 50): Promise<Document[]> {
    try {
      const documents = await this.prisma.document.findMany({
        where: { status: 'DELETED' },
        skip: offset,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      });

      return documents.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      this.logger.error(`error getting deleted documents: ${error.message}`);
      throw new Error(
        `The retrieval of deleted documents failed.: ${error.message}`,
      );
    }
  }

  async countDeleted(): Promise<number> {
    try {
      return await this.prisma.document.count({
        where: { status: 'DELETED' },
      });
    } catch (error) {
      this.logger.error(`error counting deleted documents: ${error.message}`);
      throw new Error(
        `The count of deleted documents failed.: ${error.message}`,
      );
    }
  }

  async permanentlyDelete(documentId: string): Promise<boolean> {
    try {
      await this.prisma.document.delete({
        where: {
          id: documentId,
          status: 'DELETED', // only permanently delete if it is marked as deleted
        },
      });
      this.logger.log(`document permanently deleted: ${documentId}`);
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        this.logger.warn(`document not found or not deleted: ${documentId}`);
        return false;
      }
      this.logger.error(
        `Error while permanently deleting document ${documentId}: ${error.message}`,
      );
      throw new Error(
        `The permanent deletion of the document failed.: ${error.message}`,
      );
    }
  }

  /**
   * Convert a Prisma document to a domain entity
   */
  private mapToDomain(prismaDocument: any): Document {
    return new Document(
      prismaDocument.id,
      prismaDocument.storedName,
      prismaDocument.originalName,
      prismaDocument.contentType,
      prismaDocument.size,
      this.buildDocumentUrl(prismaDocument.s3Key),
      prismaDocument.s3Key,
      prismaDocument.fileHash,
      prismaDocument.uploadedBy,
      prismaDocument.status as DocumentStatus,
      prismaDocument.extractedText,
      prismaDocument.textHash,
      prismaDocument.pageCount,
      prismaDocument.documentTitle,
      prismaDocument.documentAuthor,
      prismaDocument.language,
      prismaDocument.uploadedAt,
      prismaDocument.updatedAt,
    );
  }

  /**
   * Build the document URL based on S3 configuration
   */
  private buildDocumentUrl(s3Key: string): string {
    const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
    const bucketName = process.env.MINIO_BUCKET_NAME || 'documents';
    return `${endpoint}/${bucketName}/${s3Key}`;
  }
}
