import { Inject, Injectable } from '@nestjs/common';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import type { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import type { TokenServicePort } from '../../domain/ports/token-service.port';
import type { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import type { TokenExpirationService } from '../../domain/services/token-expiration.service';
import type { ConfigPort } from '../../domain/ports/config.port';
import { 
  HASHER, 
  SESSION_REPO, 
  TOKEN_SERVICE, 
  USER_REPO, 
  TOKEN_EXPIRATION_SERVICE,
  CONFIG_PORT
} from '../../tokens';
import { JwtPayload } from 'jsonwebtoken';
import {
  InvalidCredentialsError,
  InactiveUserError,
} from '../../domain/exceptions/auth.exceptions';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPO) private readonly users: UserRepositoryPort,
    @Inject(HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
    @Inject(SESSION_REPO) private readonly sessions: SessionRepositoryPort,
    @Inject(TOKEN_EXPIRATION_SERVICE) private readonly tokenExpiration: TokenExpirationService,
    @Inject(CONFIG_PORT) private readonly config: ConfigPort,
  ) {}

  async execute(input: {
    email: string;
    password: string;
    ip?: string;
    userAgent?: string;
  }) {
    const user = await this.users.findByEmail(input.email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.isActive) {
      throw new InactiveUserError();
    }

    const ok = await this.hasher.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new InvalidCredentialsError();
    }

    await this.sessions.revokeAll(user.id);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.tokens.signAccess(payload);
    const refreshToken = this.tokens.signRefresh(payload);

    const refreshTTL = this.config.getJwtRefreshTTL();
    const { expiresAt } = this.tokenExpiration.calculateExpiration(refreshTTL);

    await this.sessions.createSession({
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt,
      ipAddress: input.ip,
      userAgent: input.userAgent,
    });

    return { accessToken, refreshToken };
  }
}