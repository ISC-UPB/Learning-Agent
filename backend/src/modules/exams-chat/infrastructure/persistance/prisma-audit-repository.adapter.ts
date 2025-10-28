import { Injectable } from '@nestjs/common';
import { AuditRepository } from '../../domain/ports/audit-repository.port';
import { PrismaService } from '../../../../core/prisma/prisma.service';

@Injectable()
export class PrismaAuditRepositoryAdapter implements AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: {
    questionId?: string;
    timestamp: Date;
    signature: string;
    source: 'cached' | 'generated';
    tokensUsed: number;
  }): Promise<void> {
    await (this.prisma as any)['questionAudit']?.create({
      data: {
        questionId: entry.questionId ?? null,
        timestamp: entry.timestamp,
        signature: entry.signature,
        source: entry.source,
        tokensUsed: entry.tokensUsed,
      },
    });
  }
}