import { Injectable, Inject, Logger } from '@nestjs/common';
import type { LlmPort } from '../../../llm/domain/ports/llm.port';
import { LLM_PORT } from '../../../llm/tokens';
import { DsIntService } from '../../../interviewChat/infrastructure/dsInt.service';

export type GeneratedOptions = {
  options: string[];
  correctIndex: number | null;
  confidence: number | null;
};

export type GeneratedQuestion = {
  text: string;
};

@Injectable()
export class AIQuestionGenerator {
  private readonly logger = new Logger(AIQuestionGenerator.name);

  constructor(
    @Inject(LLM_PORT) private readonly deepseek: LlmPort,
    private readonly dsIntService: DsIntService,
  ) {}

  private normalizeLine(l: string) {
    return l.replace(/^[\d\)\.\-\s]+/, '').trim();
  }

  async generateQuestion(): Promise<GeneratedQuestion> {
    const resp = await this.dsIntService.generateQuestion(
      '1',
      '1',
    );
    const text =
      resp?.question ??
      'Pregunta sobre algoritmos de programación, de opción múltiple';
    return { text };
  }

  async generateTrueFalseQuestion(): Promise<GeneratedQuestion> {
    const resp = await this.dsIntService.generateQuestion(
      '1',
      '1',
    );
    const text =
      resp?.question ??
      'Pregunta de verdadero o falso sobre algoritmos de programación';
    return { text };
  }

  async generateOptions(questionText: string): Promise<GeneratedOptions> {
    if (!questionText?.trim()) throw new Error('Text required');
    const fallback: GeneratedOptions = {
      options: [
        `${questionText} — opción A`,
        `${questionText} — opción B`,
        `${questionText} — opción C`,
        `${questionText} — opción D`,
      ],
      correctIndex: null,
      confidence: null,
    };
    
    if (!this.deepseek) return fallback;
    
    const maxAttempts = 3;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const resp = await this.deepseek.complete(
          `Genera 4 opciones distintas para esta pregunta: "${questionText}"`,
          { model: { provider: 'deepseek', name: 'deepseek-chat' } },
        );
        const candidate = (resp?.text ?? '').toString().trim();
        if (!candidate) continue;
        
        const parsed = this.parseCandidate(candidate);
        if (parsed && parsed.length >= 4) {
          return {
            options: parsed.slice(0, 4),
            correctIndex: null,
            confidence: null,
          };
        }

        const lines = candidate
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map(this.normalizeLine);

        if (lines.length >= 4) {
          return {
            options: lines.slice(0, 4),
            correctIndex: null,
            confidence: null,
          };
        }

        const pieces = candidate
          .split(/;|\/|\||\t/)
          .map((p) => p.trim())
          .filter(Boolean);
          
        if (pieces.length >= 4) {
          return {
            options: pieces.slice(0, 4),
            correctIndex: null,
            confidence: null,
          };
        }
      } catch (_) {
        continue;
      }
    }
    
    return fallback;
  }

  private parseCandidate(candidate: string): string[] {
    if (!candidate) return [];

    const lines = candidate
      .split(/\r?\n/)
      .map((l) => this.normalizeLine(l))
      .filter(Boolean);
    if (lines.length >= 4) return lines;

    const pieces = candidate
      .split(/;|\/|\||\t/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (pieces.length >= 4) return pieces;

    this.logger.warn(`parseCandidate no pudo procesar: "${candidate}"`);
    return [];
  }
}