export type AuditAction =
  | 'CREATE_ROLE'
  | 'DELETE_ROLE'
  | 'ATTACH_PERMISSION'
  | 'DETACH_PERMISSION';

export interface AuditEntry {
  id?: string;
  actorId: string;
  roleId: string;
  action: AuditAction;
  timestamp: Date;
  before?: Record<string, any>;
  after?: Record<string, any>;
  reason?: string;
}
