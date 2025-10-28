import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import type { TokenServicePort } from '../../../../identity/domain/ports/token-service.port';
import { TOKEN_SERVICE } from '../../../../identity/tokens';

interface JwtPayload {
  sub?: string;
  userId?: string;
  id?: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
  ) {}

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Extract the token from the Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedException('Authorization header required');
      }

      if (!authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('The token must start with "Bearer"');
      }

      const token = authHeader.substring(7);

      if (!token) {
        throw new UnauthorizedException('Token not provided');
      }

      // Verify and decode the JWT using the same service as /auth/me
      const decoded = this.tokens.verifyAccess(token) as JwtPayload;

      // Extract user information from the JWT payload
      const userId = decoded.sub || decoded.userId || decoded.id;
      if (!userId) {
        throw new UnauthorizedException(
          'Token does not contain valid user information',
        );
      }

      req.user = {
        id: userId,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      // If it's an UnauthorizedException error, re-throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Unexpected error
      throw new UnauthorizedException('Authentication error');
    }
  }
}
