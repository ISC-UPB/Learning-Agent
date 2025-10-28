import { Inject, Injectable } from '@nestjs/common';
import { ROLE_REPO } from '../../tokens';
import type { RoleRepositoryPort } from '../../domain/ports/role.repository.port';
import type { AuditRepositoryPort } from '../../domain/ports/audit.repository.port';

@Injectable()
export class DeleteRoleUseCase {
  constructor(
    @Inject(ROLE_REPO) private readonly roleRepo: RoleRepositoryPort,
    @Inject('AuditRepositoryPort')
    private readonly auditRepo: AuditRepositoryPort,
  ) {}

  async execute(input: { roleId: string; actorId: string }) {
    const role = await this.roleRepo.findById(input.roleId);
    if (!role) throw new Error('Role not found');

    await this.roleRepo.delete(input.roleId);

    await this.auditRepo.logAuditEntry({
      actorId: input.actorId,
      timestamp: new Date(),
      action: 'DELETE_ROLE',
      roleId: role.id,
      before: { id: role.id, name: role.name, description: role.description },
      after: undefined,
      reason: 'Role deleted',
    });

    return { ok: true };
  }
}
