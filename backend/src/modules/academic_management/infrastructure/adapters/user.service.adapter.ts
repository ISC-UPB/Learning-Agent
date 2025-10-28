import { Injectable, Inject } from '@nestjs/common';
import { USER_REPO } from '../../tokens';
import type { UserRepositoryPort } from 'src/modules/identity/domain/ports/user.repository.port';
import { UserServicePort } from '../../domain/ports/user.service.port';

@Injectable()
export class UserServiceAdapter implements UserServicePort {
  constructor(@Inject(USER_REPO) private readonly userRepo: UserRepositoryPort) {}

  async createUser(
    name: string,
    lastname: string,
    email: string,
    passwordHash: string,
    active: boolean,
    roleId: string
  ): Promise<{ id: string } | null> {
    return this.userRepo.create(name, lastname, email, passwordHash, active, roleId);
  }
}
