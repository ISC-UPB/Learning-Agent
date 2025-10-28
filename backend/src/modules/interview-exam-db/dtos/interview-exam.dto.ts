export interface CreateInterviewQuestionDto {
  courseId: string;
  docId: string;
  type: 'multiple_selection' | 'double_selection' | 'open_question';
  json?: any;
}
export interface UpdateInterviewQuestionDto {
  json?: any;
  lastUsedAt?: Date;
}

export interface CreateChatHistoryDto {
  studentId: string;
  docId: string;
  question: string;
  response: string;
}
export interface UpdateChatHistoryDto {
  uses?: number;
}
