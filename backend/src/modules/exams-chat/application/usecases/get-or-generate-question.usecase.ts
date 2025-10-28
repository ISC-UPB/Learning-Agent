import { Injectable, Inject, Logger } from '@nestjs/common';
import type { QuestionRepositoryPort } from '../../domain/ports/question-repository.port';
import type { IaClientWrapper } from '../../domain/ports/ia-client-wrapper.port';
import type { AuditRepository } from '../../domain/ports/audit-repository.port';
import type { QuestionMetricsService } from '../../domain/ports/question-metrics-service.port';
import type { DocumentChunkRepositoryPort } from 'src/modules/repository_documents/domain/ports/document-chunk-repository.port';
import { createSignature } from '../../utils/createSignature';
import { EXAM_AI_GENERATOR, EXAM_QUESTION_REPO } from '../../tokens';

@Injectable()
export class GetOrGenerateQuestionUseCase {
  private readonly ttlMs = 30 * 24 * 60 * 60 * 1000;
  private readonly logger = new Logger(GetOrGenerateQuestionUseCase.name);

  constructor(
    @Inject(EXAM_QUESTION_REPO) private readonly repo: QuestionRepositoryPort,
    @Inject(EXAM_AI_GENERATOR) private readonly iaClient: IaClientWrapper,
    @Inject('AUDIT_REPO') private readonly audit: AuditRepository,
    @Inject('METRICS_SERVICE') private readonly metrics: QuestionMetricsService,
    @Inject('DOCUMENT_CHUNK_REPO') private readonly chunkRepo: DocumentChunkRepositoryPort
  ) {}

  private isFallbackOptions(questionText: string, options: string[] | null | undefined): boolean {
    if (!options || options.length < 2) return true;
    const joined = options.join(' ').toLowerCase();
    const q = (questionText || '').toLowerCase();
    const simpleFallback = options.every(
      o => o.toLowerCase().includes(q) || o.toLowerCase().startsWith(q) || o.includes(' option')
    );
    if (simpleFallback) return true;
    if (joined.length < 20) return true;
    return false;
  }

  async execute(input: { prompt: string; courseId?: string }): Promise<{ id: string; question: string; cached: boolean }> {
    if (!input.prompt?.trim()) throw new Error('Prompt is required');

    const now = new Date();
    const signature = createSignature({ text: input.prompt });

    const existing = await this.repo.findBySignature(signature);
    if (existing && existing.lastUsedAt && (now.getTime() - existing.lastUsedAt.getTime()) <= this.ttlMs) {
      existing.lastUsedAt = now;
      await this.repo.incrementUsage(existing.id, 0);
      await this.audit.record({ questionId: existing.id, timestamp: now, signature, source: 'cached', tokensUsed: existing.tokensGenerated });
      this.metrics.incrementCacheHits();
      this.metrics.addTokensSaved(existing.tokensGenerated);
      this.logger.log(`Pregunta obtenida de cache: ${existing.text}`);
      return { id: existing.id, question: existing.text, cached: true };
    }

    let contextText = '';
    if (input.courseId) {
      try {
        const allChunksData = await this.chunkRepo.findChunksWithoutEmbeddings(input.courseId);
        if (!allChunksData?.chunks || allChunksData.chunks.length === 0) {
          this.logger.warn(`No se encontraron chunks para courseId ${input.courseId}`);
        }
        const allChunks: string[] = allChunksData?.chunks?.map(c => c.content).filter(Boolean) ?? [];
        contextText = allChunks.join('\n');
        this.logger.log(`Chunks cargados: ${allChunks.length} - Contenido resumido: ${allChunks.slice(0,3).map(c => c.slice(0,50))}`);
      } catch (err) {
        this.logger.error(`Error al cargar chunks para courseId ${input.courseId}`, err);
      }
    }

    const promptWithContext = `${input.prompt}${contextText ? '\n\n' + contextText : ''}`;

    const maxAttempts = 5;
    let generatedQuestionText = '';
    let generatedOptions: string[] | null = null;
    let tokensUsed = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logger.log(`Intento de generación #${attempt}`);
        const generated = await this.iaClient.generateQuestion(promptWithContext);
        generatedQuestionText = (generated as any).questionText ?? (generated as any).question ?? '';
        tokensUsed = (generated as any).tokensUsed ?? 0;

        if (!generatedQuestionText.trim()) {
          this.logger.warn(`Generación fallida en intento #${attempt}: texto vacío`);
          continue;
        }

        if (typeof (this.iaClient as any).generateOptions === 'function') {
          const opts = await (this.iaClient as any).generateOptions(generatedQuestionText);
          generatedOptions = opts?.options ?? null;
          if (!this.isFallbackOptions(generatedQuestionText, generatedOptions)) {
            this.logger.log(`Pregunta válida generada con opciones: ${generatedOptions?.join(', ')}`);
            break;
          } else {
            this.logger.warn(`Pregunta generada pero opciones son fallback: ${generatedOptions?.join(', ')}`);
          }
        } else {
          break;
        }
      } catch (err) {
        this.logger.error(`Error en generación de IA en intento #${attempt}`, err);
      }
    }

    if (!generatedQuestionText || (generatedOptions && this.isFallbackOptions(generatedQuestionText, generatedOptions))) {
      this.logger.error('No se pudo generar una pregunta válida después de múltiples intentos');
      throw new Error('Failed to generate a valid question');
    }

    const toSave: any = {
      id: undefined,
      text: generatedQuestionText,
      type: generatedOptions && generatedOptions.length === 2 ? 'true_false' : 'multiple_choice',
      options: generatedOptions ?? null,
      status: 'generated',
      signature,
      createdAt: now,
      lastUsedAt: undefined,
      tokensGenerated: tokensUsed ?? 0,
      uses: 0,
      metadata: { ...(generatedOptions ? { generatedOptionsSource: 'ai' } : {}), courseId: input.courseId },
    };

    const saved = await this.repo.save(toSave as any);
    await this.audit.record({ questionId: saved.id, timestamp: now, signature, source: 'generated', tokensUsed });
    this.metrics.incrementCacheMisses();
    this.metrics.addTokensGenerated(tokensUsed);

    this.logger.log(`Pregunta generada y guardada con id ${saved.id}`);
    return { id: saved.id, question: saved.text, cached: false };
  }
}
