import { AuditEntry } from './../entities/audit-entry.entity';

export interface AuditRepositoryPort {
  logAuditEntry(entry: AuditEntry): Promise<void>;
  getAuditEntriesByRole(roleId: string): Promise<AuditEntry[]>;
}
