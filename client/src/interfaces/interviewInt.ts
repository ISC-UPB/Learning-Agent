export interface TitleAndOption {
  label: string;
  answer: string;
}
export interface DoubleOptionResponse {
  question: string;
  options: TitleAndOption[];
  correctAnswer: number;
  givenAnswer?: number;
  explanation: string;
  type: 'doubleOption';
}
export interface MultipleSelectionResponse {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  givenAnswer?: number;
  type: 'multipleSelection';
}

export type InterviewQuestion = MultipleSelectionResponse | DoubleOptionResponse;