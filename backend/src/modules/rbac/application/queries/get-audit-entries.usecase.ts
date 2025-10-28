import { Inject, Injectable } from '@nestjs/common';
import type { AuditRepositoryPort } from '../../domain/ports/audit.repository.port';
import type { AuditEntry } from '../../domain/entities/audit-entry.entity';

@Injectable()
export class GetAuditEntriesUseCase {
  constructor(
    @Inject('AuditRepositoryPort')
    private readonly auditRepo: AuditRepositoryPort,
  ) {}

  async execute(input: { roleId: string }): Promise<AuditEntry[]> {
    return this.auditRepo.getAuditEntriesByRole(input.roleId);
  }
}
