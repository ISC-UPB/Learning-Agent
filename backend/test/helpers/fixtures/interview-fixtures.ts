import { CreateInterviewQuestionDto, UpdateInterviewQuestionDto } from '../../../src/modules/interview-exam-db/dtos/interview-exam.dto';

export const sampleCreateDto: CreateInterviewQuestionDto = {
  courseId: 'course-1',
  docId: 'doc-1',
  type: 'open_question',
  json: { q: 'hello' },
};

export const sampleUpdateDto: UpdateInterviewQuestionDto = {
  json: { a: 1 },
};
