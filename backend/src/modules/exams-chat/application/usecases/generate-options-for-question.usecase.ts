import { Injectable, Inject } from '@nestjs/common';
import { EXAM_AI_GENERATOR, EXAM_QUESTION_REPO } from '../../tokens';
import { AIQuestionGenerator, GeneratedOptions } from '../../infrastructure/ai/ai-question.generator';
import { GetOrGenerateQuestionUseCase } from './get-or-generate-question.usecase';
import type { QuestionRepositoryPort } from '../../domain/ports/question-repository.port';

export type GenerateOptionsResult = {
  result: 'options_generated';
  question: string;
  options: string[];
  id: string;
};

@Injectable()
export class GenerateOptionsForQuestionUseCase {
  constructor(
    @Inject(EXAM_AI_GENERATOR) private readonly aiGenerator: AIQuestionGenerator,
    private readonly getOrGenerate: GetOrGenerateQuestionUseCase,
    @Inject(EXAM_QUESTION_REPO) private readonly repo: QuestionRepositoryPort
  ) {}

  async execute(params: { questionId?: string; courseId?: string; prompt?: string }): Promise<GenerateOptionsResult> {
    if (params.questionId) {
      const q = await this.repo.findById(params.questionId);
      if (!q) throw new Error('Question not found');
      const aiResult: GeneratedOptions = await this.aiGenerator.generateOptions(q.text);
      const options = aiResult.options && aiResult.options.length >= 2 ? aiResult.options.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D'];
      return { result: 'options_generated', question: q.text, options, id: q.id };
    } else {
      const prompt = params.prompt ?? 'Generate a question';
      const generated = await this.getOrGenerate.execute({ prompt, courseId: params.courseId ?? '' });
      const aiResult: GeneratedOptions = await this.aiGenerator.generateOptions(generated.question);
      const options = aiResult.options && aiResult.options.length >= 2
        ? aiResult.options.slice(0, 4)
        : (generated.question.includes('True') || generated.question.includes('False')
          ? ['True', 'False']
          : ['Option A', 'Option B', 'Option C', 'Option D']);
      return { result: 'options_generated', question: generated.question, options, id: generated.id };
    }
  }
}
