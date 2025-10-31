import { Course } from '../../../academic_management/domain/entities/course.entity';
import { Document, DocumentStatus } from '../../../repository_documents/domain/entities/document.entity';
import { InterviewQuestion } from '../entities/interview-question.entity';

export type InterviewQuestionRawData = {
  id: string;
  courseId: string;
  docId: string;
  json: Record<string, any> | null;
  type: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  course?: {
    id: string;
    name: string;
    isActive: boolean;
    teacherId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  document?: {
    id: string;
    originalName: string;
    storedName: string;
    s3Key: string;
    size: number;
    contentType: string;
    fileHash: string;
    textHash: string | null;
    extractedText: string | null;
    status: DocumentStatus;
    uploadedBy: string;
    courseId: string | null;
    classId: string | null;
    pageCount: number | null;
    documentTitle: string | null;
    documentAuthor: string | null;
    language: string | null;
    uploadedAt: Date;
    updatedAt: Date;
  };
};

export class InterviewQuestionMapper {
  static toDomain(raw: InterviewQuestionRawData): InterviewQuestion {
    return InterviewQuestion.create({
      id: raw.id,
      courseId: raw.courseId,
      docId: raw.docId,
      json: raw.json || {},
      type: raw.type,
      lastUsedAt: raw.lastUsedAt,
      createdAt: raw.createdAt,
      course: raw.course ? {
        id: raw.course.id,
        name: raw.course.name,
        isActive: raw.course.isActive,
        teacherId: raw.course.teacherId,
        createdAt: raw.course.createdAt,
        updatedAt: raw.course.updatedAt,
      } as Course : undefined,
      document: raw.document ? new Document(
        raw.document.id,
        raw.document.originalName, // fileName
        raw.document.originalName, // originalName
        raw.document.contentType, // mimeType
        raw.document.size,
        raw.document.s3Key, // url/path
        raw.document.s3Key,
        raw.document.fileHash,
        raw.document.uploadedBy,
        raw.document.status,
        raw.document.extractedText || '', // extractedText
        raw.document.textHash || '', // textHash
        raw.document.pageCount || 0, // pageCount
        raw.document.documentTitle || '', // documentTitle
        raw.document.documentAuthor || '', // documentAuthor
        raw.document.language || '', // language
        raw.document.courseId || undefined,
        raw.document.classId || undefined,
        raw.document.uploadedAt,
        raw.document.updatedAt
      ) : undefined,
    });
  }

  static toDomainArray(rawArray: InterviewQuestionRawData[]): InterviewQuestion[] {
    return rawArray.map(raw => this.toDomain(raw));
  }

  static toPersistence(entity: InterviewQuestion): Record<string, any> {
    return {
      id: entity.id,
      courseId: entity.courseId,
      docId: entity.docId,
      json: entity.json || null,
      type: entity.type,
      lastUsedAt: entity.lastUsedAt,
      createdAt: entity.createdAt,
    };
  }
}