import { Inject, Injectable } from '@nestjs/common';
import { PERM_REPO, AUTHZ_PORT } from '../../tokens';
import type { PermissionRepositoryPort } from '../../domain/ports/permission.repository.port';
import type { AuthorizationPort } from '../../../identity/domain/ports/authorization.port';

@Injectable()
export class CreatePermissionUseCase {
  constructor(
    @Inject(PERM_REPO) private readonly permRepo: PermissionRepositoryPort,
    @Inject(AUTHZ_PORT) private readonly authz: AuthorizationPort,
  ) { }

  async execute(input: {
    action: string;
    resource: string;
    description?: string | null;
    userId: string; 
  }) {
    
    const isAdmin = await this.authz.hasRole(input.userId, 'admin');
    const hasPermission = await this.authz.hasPermission(input.userId, 'manage', 'permissions');

    if (!isAdmin && !hasPermission) {
      await this.authz.requiresRole(input.userId, 'admin'); 
    }

    const exists = await this.permRepo.findByActionResource(
      input.action,
      input.resource,
    );
    if (exists) throw new Error('Permission already exists');
    return this.permRepo.create(
      input.action,
      input.resource,
      input.description ?? null,
    );
  }
}
