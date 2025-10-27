import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthController } from './infrastructure/http/auth.controller';
import { LoginUseCase } from './application/commands/login.usecase';
import { RefreshUseCase } from './application/commands/refresh.usecase';
import { LogoutUseCase } from './application/commands/logout.usecase';
import {
  USER_REPO,
  SESSION_REPO,
  HASHER,
  TOKEN_SERVICE,
  AUTHZ_PORT,
  TOKEN_EXPIRATION_SERVICE,
  CONFIG_PORT,
} from './tokens';
import { UserPrismaRepository } from './infrastructure/persistence/user.prisma.repository';
import { SessionPrismaRepository } from './infrastructure/persistence/session.prisma.repository';
import { BcryptHasher } from './infrastructure/crypto/bcrypt.hasher';
import { JwtTokenService } from './infrastructure/jwt/jwt.token.service';
import { GetMeUseCase } from './application/queries/get-me.usecase';
import { JwtStrategy } from './infrastructure/http/jwt.strategy';
import { RbacAuthzAdapter } from './infrastructure/authz/rbac-authz.adapter';
import { RbacModule } from '../rbac/rbac.module';
import { RequestInfoService } from './infrastructure/request-info.service';
import { TokenExpirationService } from './domain/services/token-expiration.service';
import { EnvConfigAdapter } from './infrastructure/config/env-config.adapter';

@Module({
  imports: [PrismaModule, forwardRef(() => RbacModule)],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    GetMeUseCase,
    JwtStrategy,
    RequestInfoService,
    { provide: USER_REPO, useClass: UserPrismaRepository },
    { provide: SESSION_REPO, useClass: SessionPrismaRepository },

    { provide: HASHER, useClass: BcryptHasher },

    { provide: TOKEN_SERVICE, useClass: JwtTokenService },

    TokenExpirationService,
    { provide: TOKEN_EXPIRATION_SERVICE, useClass: TokenExpirationService },

    RbacAuthzAdapter,
    { provide: AUTHZ_PORT, useClass: RbacAuthzAdapter },

    { provide: CONFIG_PORT, useClass: EnvConfigAdapter },
  ],
  exports: [
    TOKEN_SERVICE,
    USER_REPO,
    HASHER,
    TOKEN_EXPIRATION_SERVICE,
    TokenExpirationService,
    AUTHZ_PORT,
  ],
})
export class IdentityModule { }