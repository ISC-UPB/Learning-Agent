import { Injectable, Inject } from '@nestjs/common';
import { ROLE_REPO } from '../../tokens';
import type { RoleRepositoryPort } from 'src/modules/rbac/domain/ports/role.repository.port';
import { RoleServicePort } from '../../domain/ports/role.service.port';

@Injectable()
export class RoleServiceAdapter implements RoleServicePort {
  constructor(@Inject(ROLE_REPO) private readonly roleRepo: RoleRepositoryPort) {}

  async findRoleByName(name: string): Promise<{ id: string } | null> {
    return this.roleRepo.findByName(name);
  }
}
