import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { JwtFromRequestFunction, StrategyOptions } from 'passport-jwt';
import { CONFIG_PORT } from '../../tokens';
import type { ConfigPort } from '../../domain/ports/config.port';

type AccessPayload = { sub: string; email: string; sid?: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(CONFIG_PORT) private readonly config: ConfigPort) {
    const bearerExtractor: JwtFromRequestFunction<Request> = (req) =>
      ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    const secret = config.getJwtAccessSecret();

    const options: StrategyOptions = {
      jwtFromRequest: bearerExtractor,
      secretOrKey: secret,
      ignoreExpiration: false,
    };

    super(options);
  }

  validate(payload: AccessPayload) {
    return payload;
  }
}
