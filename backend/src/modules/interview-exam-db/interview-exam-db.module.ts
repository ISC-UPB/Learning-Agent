import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { ChatHistoryRepository } from './int-exam/chatH.repository';
import { PrismaInterviewQuestionRepository } from './infrastructure/persistence/prisma-interview-question.repository';
import { InterviewQuestionController } from './infrastructure/http/interview-question.controller';
import { ChatHistoryController } from './infrastructure/http/chat-history.controller';

@Module({
  imports: [PrismaModule],
  controllers: [InterviewQuestionController, ChatHistoryController],
  providers: [
    {
      provide: 'INTERVIEW_QUESTION_REPOSITORY',
      useClass: PrismaInterviewQuestionRepository,
    },
    ChatHistoryRepository,
  ],
  exports: [
    'INTERVIEW_QUESTION_REPOSITORY',
    ChatHistoryRepository,
  ],
})
export class InterviewExamDbModule {}
