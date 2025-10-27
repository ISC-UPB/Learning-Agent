import { Inject, Injectable } from '@nestjs/common';
import type { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import type { TokenServicePort } from '../../domain/ports/token-service.port';
import type { TokenExpirationService } from '../../domain/services/token-expiration.service';
import type { ConfigPort } from '../../domain/ports/config.port';
import { SESSION_REPO, TOKEN_SERVICE, TOKEN_EXPIRATION_SERVICE, CONFIG_PORT } from '../../tokens';

@Injectable()
export class RefreshUseCase {
  constructor(
    @Inject(SESSION_REPO) private readonly sessions: SessionRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
    @Inject(TOKEN_EXPIRATION_SERVICE) private readonly tokenExpiration: TokenExpirationService,
    @Inject(CONFIG_PORT) private readonly config: ConfigPort,
  ) {}

  async execute(input: { refreshToken: string }) {
    const payload = this.tokens.verifyRefresh(input.refreshToken);

    const session = await this.sessions.findByRefreshToken(input.refreshToken);
    if (
      !session ||
      session.userId !== payload.sub ||
      session.expiresAt < new Date()
    ) {
      throw new Error('Invalid session');
    }

    await this.sessions.revokeById(session.id);

    const newAccess = this.tokens.signAccess({
      sub: payload.sub,
      email: payload.email,
    });
    const newRefresh = this.tokens.signRefresh({
      sub: payload.sub,
      email: payload.email,
    });

    const refreshTTL = this.config.getJwtRefreshTTL();
    const { expiresAt } = this.tokenExpiration.calculateExpiration(refreshTTL);

    await this.sessions.createSession({
      userId: payload.sub,
      token: newAccess,
      refreshToken: newRefresh,
      expiresAt,
    });

    return { accessToken: newAccess, refreshToken: newRefresh };
  }
}