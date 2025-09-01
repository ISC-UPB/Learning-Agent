// src/documents/infrastructure/http/middleware/auth.middleware.ts
import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import type { TokenServicePort } from '../../../../identity/domain/ports/token-service.port';
import { TOKEN_SERVICE } from '../../../../identity/tokens';

// Interface para el payload del JWT
interface JwtPayload {
  sub?: string;
  userId?: string;
  id?: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// Extender el tipo Request para incluir user
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
      // 1. Extraer token del header Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedException('Header Authorization requerido');
      }

      if (!authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Token debe comenzar con Bearer');
      }

      const token = authHeader.substring(7); // Remover 'Bearer '

      if (!token) {
        throw new UnauthorizedException('Token no proporcionado');
      }

      // 2. Verificar y decodificar el JWT usando el mismo servicio que /auth/me
      const decoded = this.tokens.verifyAccess(token) as JwtPayload;

      // 3. Extraer información del usuario del payload JWT
      const userId = decoded.sub || decoded.userId || decoded.id;
      if (!userId) {
        throw new UnauthorizedException(
          'Token no contiene información de usuario válida',
        );
      }

      req.user = {
        id: userId,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      
      // Si es un error de UnauthorizedException, re-lanzarlo
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Error inesperado
      throw new UnauthorizedException('Error de autenticación');
    }
  }
}
