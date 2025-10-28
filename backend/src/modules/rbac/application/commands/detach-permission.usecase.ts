import { Inject, Injectable } from '@nestjs/common';
import { ROLE_REPO, PERM_REPO } from '../../tokens';
import type { RoleRepositoryPort } from '../../domain/ports/role.repository.port';
import type { PermissionRepositoryPort } from '../../domain/ports/permission.repository.port';
import type { AuditRepositoryPort } from '../../domain/ports/audit.repository.port';

@Injectable()
export class DetachPermissionUseCase {
  constructor(
    @Inject(ROLE_REPO) private readonly roleRepo: RoleRepositoryPort,
    @Inject(PERM_REPO) private readonly permRepo: PermissionRepositoryPort,
    @Inject('AuditRepositoryPort')
    private readonly auditRepo: AuditRepositoryPort,
  ) {}

  async execute(input: { roleId: string; permissionId: string; actorId: string }) {
    const [role, perm] = await Promise.all([
      this.roleRepo.findById(input.roleId),
      this.permRepo.findById(input.permissionId),
    ]);
    if (!role) throw new Error('Role not found');
    if (!perm) throw new Error('Permission not found');

    await this.roleRepo.detachPermission(input.roleId, input.permissionId);

    await this.auditRepo.logAuditEntry({
      actorId: input.actorId,
      timestamp: new Date(),
      action: 'DETACH_PERMISSION',
      roleId: role.id,
      before: { ...role },
      after: {
        ...role,
        permissions: (role.permissions ?? []).filter((p) => p.id !== perm.id),
      },
      reason: `Detached permission ${perm.id}`,
    });

    return { ok: true };
  }
}
