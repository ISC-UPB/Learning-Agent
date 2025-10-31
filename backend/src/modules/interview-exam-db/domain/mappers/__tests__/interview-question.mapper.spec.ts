import { describe, expect, it } from '@jest/globals';
import { InterviewQuestionMapper, InterviewQuestionRawData } from '../interview-question.mapper';
import { Course } from '../../../../academic_management/domain/entities/course.entity';
import { Document, DocumentStatus } from '../../../../repository_documents/domain/entities/document.entity';

describe('InterviewQuestionMapper', () => {
  const mockDate = new Date('2025-10-30T12:00:00Z');
  const mockRawData: InterviewQuestionRawData = {
    id: '1',
    courseId: 'course-1',
    docId: 'doc-1',
    json: { question: 'Test question?' },
    type: 'multiple-choice',
    lastUsedAt: mockDate,
    createdAt: mockDate,
    course: {
      id: 'course-1',
      name: 'Test Course',
      isActive: true,
      teacherId: 'teacher-1',
      createdAt: mockDate,
      updatedAt: mockDate,
    },
    document: {
      id: 'doc-1',
      originalName: 'test-doc.pdf',
      storedName: 'test-doc-1234.pdf',
      s3Key: '/test/doc.pdf',
      size: 1024,
      contentType: 'application/pdf',
      fileHash: 'hash123',
      textHash: 'texthash123',
      extractedText: 'Test content',
      status: DocumentStatus.UPLOADED,
      uploadedBy: 'user-1',
      courseId: 'course-1',
      classId: null,
      pageCount: 1,
      documentTitle: 'Test Document',
      documentAuthor: 'Test Author',
      language: 'es',
      uploadedAt: mockDate,
      updatedAt: mockDate,
    },
  };

  describe('toDomain', () => {
    it('should map raw data to domain entity correctly', () => {
      const domainEntity = InterviewQuestionMapper.toDomain(mockRawData);

      expect(domainEntity.id).toBe(mockRawData.id);
      expect(domainEntity.courseId).toBe(mockRawData.courseId);
      expect(domainEntity.docId).toBe(mockRawData.docId);
      expect(domainEntity.json).toEqual(mockRawData.json);
      expect(domainEntity.type).toBe(mockRawData.type);
      expect(domainEntity.lastUsedAt).toBe(mockRawData.lastUsedAt);
      expect(domainEntity.createdAt).toBe(mockRawData.createdAt);

      // Course mapping
      expect(domainEntity.course).toBeDefined();
      expect(domainEntity.course?.id).toBe(mockRawData.course?.id);
      expect(domainEntity.course?.name).toBe(mockRawData.course?.name);
      expect(domainEntity.course?.isActive).toBe(mockRawData.course?.isActive);
      expect(domainEntity.course?.teacherId).toBe(mockRawData.course?.teacherId);

      // Document mapping
      expect(domainEntity.document).toBeDefined();
      expect(domainEntity.document?.id).toBe(mockRawData.document?.id);
      expect(domainEntity.document?.fileName).toBe(mockRawData.document?.originalName);
      expect(domainEntity.document?.originalName).toBe(mockRawData.document?.originalName);
      expect(domainEntity.document?.url).toBe(mockRawData.document?.s3Key);
      expect(domainEntity.document?.mimeType).toBe(mockRawData.document?.contentType);
      expect(domainEntity.document?.size).toBe(mockRawData.document?.size);
      expect(domainEntity.document?.courseId).toBe(mockRawData.document?.courseId);
      expect(domainEntity.document?.documentTitle).toBe(mockRawData.document?.documentTitle);
      expect(domainEntity.document?.documentAuthor).toBe(mockRawData.document?.documentAuthor);
    });

    it('should handle null lastUsedAt', () => {
      const rawDataWithNullLastUsed = {
        ...mockRawData,
        lastUsedAt: null,
      };

      const domainEntity = InterviewQuestionMapper.toDomain(rawDataWithNullLastUsed);
      expect(domainEntity.lastUsedAt).toBeNull();
    });

    it('should handle missing optional fields', () => {
      const rawDataWithoutOptionals = {
        id: '1',
        courseId: 'course-1',
        docId: 'doc-1',
        json: { question: 'Test question?' },
        type: 'multiple-choice',
        lastUsedAt: mockDate,
        createdAt: mockDate,
      };

      const domainEntity = InterviewQuestionMapper.toDomain(rawDataWithoutOptionals);
      expect(domainEntity.course).toBeUndefined();
      expect(domainEntity.document).toBeUndefined();
    });
  });

  describe('toDomainArray', () => {
    it('should map array of raw data to array of domain entities', () => {
      const rawArray = [mockRawData, { ...mockRawData, id: '2' }];
      const domainArray = InterviewQuestionMapper.toDomainArray(rawArray);

      expect(domainArray).toHaveLength(2);
      expect(domainArray[0].id).toBe('1');
      expect(domainArray[1].id).toBe('2');
    });
  });

  describe('toPersistence', () => {
    it('should map domain entity to raw data without course and document', () => {
      const domainEntity = InterviewQuestionMapper.toDomain(mockRawData);
      const persistenceData = InterviewQuestionMapper.toPersistence(domainEntity);

      expect(persistenceData.id).toBe(domainEntity.id);
      expect(persistenceData.courseId).toBe(domainEntity.courseId);
      expect(persistenceData.docId).toBe(domainEntity.docId);
      expect(persistenceData.json).toEqual(domainEntity.json);
      expect(persistenceData.type).toBe(domainEntity.type);
      expect(persistenceData.lastUsedAt).toBe(domainEntity.lastUsedAt);
      expect(persistenceData.createdAt).toBe(domainEntity.createdAt);
      expect((persistenceData as any).course).toBeUndefined();
      expect((persistenceData as any).document).toBeUndefined();
    });
  });
});