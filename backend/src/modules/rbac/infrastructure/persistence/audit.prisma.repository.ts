import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import type { AuditRepositoryPort } from '../../domain/ports/audit.repository.port';
import type { AuditEntry, AuditAction } from '../../domain/entities/audit-entry.entity';
import { JsonValue } from '@prisma/client/runtime/library';

function ensureRecord(value: JsonValue | null): Record<string, any> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : undefined;
}

@Injectable()
export class AuditPrismaRepository implements AuditRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async logAuditEntry(entry: AuditEntry): Promise<void> {
    await this.prisma.rbacAudit.create({
      data: {
        actorId: entry.actorId,
        roleId: entry.roleId,
        action: entry.action,
        timestamp: entry.timestamp,
        before: entry.before ?? undefined,
        after: entry.after ?? undefined,
        reason: entry.reason ?? undefined,
      },
    });
  }

  async getAuditEntriesByRole(roleId: string): Promise<AuditEntry[]> {
    const rows = await this.prisma.rbacAudit.findMany({
      where: { roleId },
      orderBy: { timestamp: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      actorId: row.actorId,
      roleId: row.roleId,
      action: row.action as AuditAction,
      timestamp: row.timestamp,
      before: ensureRecord(row.before),
      after: ensureRecord(row.after),
      reason: row.reason ?? undefined,
    }));
  }
}
