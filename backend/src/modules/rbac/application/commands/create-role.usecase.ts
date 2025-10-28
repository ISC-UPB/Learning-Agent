import {
  Inject,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ROLE_REPO, AUTHZ_PORT } from '../../tokens';
import type { RoleRepositoryPort } from '../../domain/ports/role.repository.port';
import type { AuthorizationPort } from '../../../identity/domain/ports/authorization.port';
import type { AuditRepositoryPort } from '../../domain/ports/audit.repository.port';
import { Role } from '../../domain/entities/role.entity';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLE_REPO) private readonly roleRepo: RoleRepositoryPort,
    @Inject(AUTHZ_PORT) private readonly authz: AuthorizationPort,
    @Inject('AuditRepositoryPort') private readonly auditRepo: AuditRepositoryPort,
  ) {}

  async execute(input: {
    name: string;
    description?: string | null;
    permissionIds?: string[];
    actorId: string;
  }): Promise<Role> {
    // Validación de autorización
    const isAdmin = await this.authz.hasRole(input.actorId, 'admin');
    const hasPermission = await this.authz.hasPermission(input.actorId, 'manage', 'roles');

    if (!isAdmin && !hasPermission) {
      await this.authz.requiresRole(input.actorId, 'admin');
    }

    // Validación de unicidad
    if (await this.roleRepo.findByName(input.name)) {
      throw new BadRequestException('Role name already exists');
    }

    try {
      const newRole = input.permissionIds?.length
        ? await this.roleRepo.createWithPermissions(
            input.name,
            input.description ?? null,
            input.permissionIds,
          )
        : await this.roleRepo.create(input.name, input.description ?? null);

      // Registro de auditoría
      await this.auditRepo.logAuditEntry({
        actorId: input.actorId,
        timestamp: new Date(),
        action: 'CREATE_ROLE',
        roleId: newRole.id,
        after: {
          id: newRole.id,
          name: newRole.name,
          description: newRole.description,
        },
        reason: 'Role created via CreateRoleUseCase',
      });

      return newRole;
    } catch (err) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Error creating role',
      );
    }
  }
}
