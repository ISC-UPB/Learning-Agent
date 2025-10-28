import { Module } from '@nestjs/common';
import { IntExamRepository } from './int-exam/int-exam.repository';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { ChatHistoryRepository } from './int-exam/chatH.repository';

@Module({
  imports: [PrismaModule],
  providers: [IntExamRepository, ChatHistoryRepository],
  exports: [IntExamRepository, ChatHistoryRepository],
})
export class InterviewExamDbModule {}
