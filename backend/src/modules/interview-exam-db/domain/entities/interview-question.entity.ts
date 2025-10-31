import { Course } from '../../../academic_management/domain/entities/course.entity';
import { Document } from '../../../repository_documents/domain/entities/document.entity';

export class InterviewQuestion {
  constructor(
    public readonly id: string,
    public readonly courseId: string,
    public readonly docId: string,
    public readonly json: Record<string, any>,
    public readonly type: string,
    public readonly lastUsedAt: Date | null,
    public readonly createdAt: Date,
    public readonly course?: Course,
    public readonly document?: Document,
  ) {}

  static create(props: {
    id: string;
    courseId: string;
    docId: string;
    json: Record<string, any>;
    type: string;
    lastUsedAt?: Date | null;
    createdAt?: Date;
    course?: Course;
    document?: Document;
  }): InterviewQuestion {
    return new InterviewQuestion(
      props.id,
      props.courseId,
      props.docId,
      props.json,
      props.type,
      props.lastUsedAt || null,
      props.createdAt || new Date(),
      props.course,
      props.document,
    );
  }
}