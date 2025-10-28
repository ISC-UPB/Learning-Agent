import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { TokenServicePort } from '../../domain/ports/token-service.port';
import { AccessPayload, RefreshPayload } from './jwt.types';
import { CONFIG_PORT } from '../../tokens';
import type { ConfigPort } from '../../domain/ports/config.port';

@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(@Inject(CONFIG_PORT) private readonly config: ConfigPort) {}

  private asExpiresIn(v?: string): jwt.SignOptions['expiresIn'] {
    return (v ?? this.config.getJwtAccessTTL()) as jwt.SignOptions['expiresIn'];
  }

  private asExpiresInRefresh(v?: string): jwt.SignOptions['expiresIn'] {
    return (v ??
      this.config.getJwtRefreshTTL()) as jwt.SignOptions['expiresIn'];
  }

  signAccess(payload: AccessPayload, ttl?: string): string {
    const secret = this.config.getJwtAccessSecret() as jwt.Secret;
    const opts: jwt.SignOptions = { expiresIn: this.asExpiresIn(ttl) };
    return jwt.sign(payload, secret, opts);
  }

  signRefresh(payload: RefreshPayload, ttl?: string): string {
    const secret = this.config.getJwtRefreshSecret() as jwt.Secret;
    const opts: jwt.SignOptions = { expiresIn: this.asExpiresInRefresh(ttl) };
    return jwt.sign(payload, secret, opts);
  }

  verifyAccess(token: string): AccessPayload {
    const secret = this.config.getJwtAccessSecret() as jwt.Secret;
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'string' || !decoded.sub || !decoded.email) {
      throw new UnauthorizedException('Malformed access token');
    }
    return decoded as AccessPayload;
  }

  verifyRefresh(token: string): RefreshPayload {
    const secret = this.config.getJwtRefreshSecret() as jwt.Secret;
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'string' || !decoded.sub || !decoded.email) {
      throw new UnauthorizedException('Malformed refresh token');
    }
    return decoded as RefreshPayload;
  }
}
