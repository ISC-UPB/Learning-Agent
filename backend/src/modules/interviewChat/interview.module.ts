import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AiConfigService } from '../../core/ai/ai.config';
import { LlmModule } from '../llm/llm.module';
import { ChatIntController } from './infrastructure/http/chatInt.controller';
import { DeepseekAdapter } from '../llm/infrastructure/adapters/ds.adapter';
import { LLM_PORT } from '../llm/tokens';
import { DsIntService } from './infrastructure/dsInt.service';
import { PromptTemplateModule } from '../prompt-template/prompt-template.module';
import { DocumentsModule } from '../repository_documents/documents.module';
import { InterviewExamDbModule } from '../interview-exam-db/interview-exam-db.module';

@Module({
  imports: [
    PrismaModule,
    LlmModule,
    PromptTemplateModule,
    DocumentsModule,
    InterviewExamDbModule,
  ],
  controllers: [ChatIntController],
  providers: [
    AiConfigService,
    DsIntService,
    DeepseekAdapter,
    { provide: LLM_PORT, useExisting: DeepseekAdapter },
  ],
  exports: [
    DsIntService,
  ],
})
export class InterviewModule {}