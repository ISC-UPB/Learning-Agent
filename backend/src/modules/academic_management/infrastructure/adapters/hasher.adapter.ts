import { Injectable, Inject } from '@nestjs/common';
import { HASHER } from '../../tokens';
import { HasherPort } from '../../domain/ports/hasher.port';
import type { BcryptHasher } from 'src/modules/identity/infrastructure/crypto/bcrypt.hasher';

@Injectable()
export class HasherAdapter implements HasherPort {
  constructor(@Inject(HASHER) private readonly hasher: BcryptHasher) {}

  async hash(value: string): Promise<string> {
    return this.hasher.hash(value);
  }
}
