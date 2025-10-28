import { Injectable, Inject } from '@nestjs/common';
import { ROLE_REPO, PERM_REPO } from '../../tokens';
import { AUTHZ_PORT } from '../../../identity/tokens';
import type { RoleRepositoryPort } from '../../domain/ports/role.repository.port';
import type { PermissionRepositoryPort } from '../../domain/ports/permission.repository.port';
import type { AuditRepositoryPort } from '../../domain/ports/audit.repository.port';
import type { AuthorizationPort } from '../../../identity/domain/ports/authorization.port';

@Injectable()
export class AttachPermissionUseCase {
  constructor(
    @Inject(ROLE_REPO) private readonly roleRepo: RoleRepositoryPort,
    @Inject(PERM_REPO) private readonly permRepo: PermissionRepositoryPort,
    @Inject('AuditRepositoryPort') private readonly auditRepo: AuditRepositoryPort,
    @Inject(AUTHZ_PORT) private readonly authz: AuthorizationPort,
  ) {}

  async execute(input: {
    roleId: string;
    permissionId: string;
    actorId: string;
  }) {
    const isAdmin = await this.authz.hasRole(input.actorId, 'admin');
    const hasPermission = await this.authz.hasPermission(input.actorId, 'manage', 'permissions');

    if (!isAdmin && !hasPermission) {
      await this.authz.requiresRole(input.actorId, 'admin');
    }

    const [role, perm] = await Promise.all([
      this.roleRepo.findById(input.roleId),
      this.permRepo.findById(input.permissionId),
    ]);
    if (!role) throw new Error('Role not found');
    if (!perm) throw new Error('Permission not found');

    await this.roleRepo.attachPermission(input.roleId, input.permissionId);

    await this.auditRepo.logAuditEntry({
      actorId: input.actorId,
      timestamp: new Date(),
      action: 'ATTACH_PERMISSION',
      roleId: role.id,
      before: { roleId: role.id, permissionAttached: false },
      after: { roleId: role.id, permissionAttached: true, permissionId: perm.id },
      reason: `Attached permission ${perm.id}`,
    });

    return { ok: true };
  }
}

