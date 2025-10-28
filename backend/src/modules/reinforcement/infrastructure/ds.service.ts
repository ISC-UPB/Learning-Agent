import { PROMPT_TEMPLATE_PORT } from 'src/modules/prompt-template/tokens';
import type { PromptTemplatePort } from 'src/modules/prompt-template/domain/ports/prompt-template.port';
import { Inject, Injectable } from '@nestjs/common';
import type { LlmPort } from 'src/modules/llm/domain/ports/llm.port';
import { LLM_PORT } from 'src/modules/llm/tokens';
import { ChatResponse } from './http/dto/response';
import { GetDocumentContentUseCase } from 'src/modules/repository_documents/application/queries/get-document-content.usecase';
import { ChatHistoryRepository } from 'src/modules/interview-exam-db/int-exam/chatH.repository';

@Injectable()
export class DsService {
  constructor(
    @Inject(LLM_PORT) private readonly llm: LlmPort,
    @Inject(PROMPT_TEMPLATE_PORT)
    private readonly promptTemplatePort: PromptTemplatePort,
    private readonly getDocumentContentUseCase: GetDocumentContentUseCase,
    private readonly chatHistoryRepository: ChatHistoryRepository,
  ) {}
  async generateResponse(
    question: string,
    studentId: string,
    docId: string,
  ): Promise<ChatResponse> {
    try {
      const delCount = await this.chatHistoryRepository.cleanupOldChatHistory();
      console.log('delCount:', delCount);
      const existing =
        await this.chatHistoryRepository.findByQuestion(question);
      if (existing) {
        await this.chatHistoryRepository.update(existing.id, {
          uses: existing.uses + 1,
        });
        return { answer: existing.response } as ChatResponse;
      }
      const doc = await this.getDocumentContentUseCase.execute({ docId });
      console.log('doc:', doc);
      const vars: Record<string, string> = {
        user_question: question,
        content: doc.contenido,
      };
      const prompt = await this.promptTemplatePort.render(
        'singleQuestion.v1',
        vars,
      );
      const resp = await this.llm.complete(prompt, {
        model: { provider: 'deepseek', name: 'deepseek-chat' },
        temperature: 1.3,
        metadata: {
          response_format: 'json_object',
        },
        maxTokens: 500,
      });
      const ans = JSON.parse(
        resp.text || '{"answer":"No response from AI"}',
      ) as ChatResponse;
      await this.chatHistoryRepository.create({
        studentId,
        docId,
        question,
        response: ans.answer,
      });
      return ans;
    } catch (error) {
      console.error('OpenAI Error:', error);
      throw new Error('Error generating AI response');
    }
  }
  async findByStudentAndDocument(
    studentId: string,
    docId: string,
  ): Promise<ChatResponse[]> {
    const chatHistory =
      await this.chatHistoryRepository.findByStudentAndDocument(
        studentId,
        docId,
      );
    return chatHistory.map(
      (item) =>
        ({
          question: item.question,
          answer: item.response,
        }) as ChatResponse,
    );
  }
}
