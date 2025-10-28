import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import type { AuthorizationPort } from '../../domain/ports/authorization.port';
import { GetRolesForUserUseCase } from '../../../rbac/application/queries/get-roles-for-user.usecase';
import { ROLE_REPO } from '../../../rbac/tokens';
import type { RoleRepositoryPort } from '../../../rbac/domain/ports/role.repository.port';

@Injectable()
export class RbacAuthzAdapter implements AuthorizationPort {
  constructor(
    private readonly rbacQuery: GetRolesForUserUseCase,
    @Inject(ROLE_REPO) private readonly roleRepo: RoleRepositoryPort,
  ) { }

  async getRolesForUser(userId: string): Promise<string[]> {
    const roles = await this.rbacQuery.execute({ userId });
    return roles.map((r) => r.name);
  }

  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const userRoles = await this.getRolesForUser(userId);
    return userRoles.includes(roleName);
  }

  async hasPermission(userId: string, action: string, resource: string): Promise<boolean> {
    const permissions = await this.roleRepo.getPermissionsForUser(userId);
    return permissions.some(p => p.action === action && p.resource === resource);
  }

  async requiresRole(userId: string, roleName: string): Promise<void> {
    const hasRole = await this.hasRole(userId, roleName);
    if (!hasRole) {
      throw new ForbiddenException(`Acceso denegado: Se requiere el rol '${roleName}'`);
    }
  }

  async requiresPermission(userId: string, action: string, resource: string): Promise<void> {
    const hasPermission = await this.hasPermission(userId, action, resource);
    if (!hasPermission) {
      throw new ForbiddenException(`Acceso denegado: Se requiere el permiso '${action}' en '${resource}'`);
    }
  }
}
