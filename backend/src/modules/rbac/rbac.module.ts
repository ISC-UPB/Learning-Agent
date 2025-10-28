import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { ROLE_REPO, PERM_REPO, AUTHZ_PORT } from './tokens';
import { RolePrismaRepository } from './infrastructure/persistence/role.prisma.repository';
import { PermissionPrismaRepository } from './infrastructure/persistence/permission.prisma.repository';
import { AuditPrismaRepository } from './infrastructure/persistence/audit.prisma.repository';
import { CreateRoleUseCase } from './application/commands/create-role.usecase';
import { CreatePermissionUseCase } from './application/commands/create-permission.usecase';
import { AttachPermissionUseCase } from './application/commands/attach-permission.usecase';
import { DetachPermissionUseCase } from './application/commands/detach-permission.usecase';
import { DeleteRoleUseCase } from './application/commands/delete-role.usecase';
import { ListRolesUseCase } from './application/queries/list-roles.usecase';
import { ListPermissionsUseCase } from './application/queries/list-permissions.usecase';
import { GetRolesForUserUseCase } from './application/queries/get-roles-for-user.usecase';
import { GetAuditEntriesUseCase } from './application/queries/get-audit-entries.usecase';
import { RbacController } from './infrastructure/http/rbac.controller';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { IdentityModule } from '../identity/identity.module';
import { AUTHZ_PORT as IDENTITY_AUTHZ_PORT } from '../identity/tokens';

@Module({
  imports: [PrismaModule, forwardRef(() => IdentityModule)],
  controllers: [RbacController],
  providers: [
    { provide: ROLE_REPO, useClass: RolePrismaRepository },
    { provide: PERM_REPO, useClass: PermissionPrismaRepository },
    { provide: 'AuditRepositoryPort', useClass: AuditPrismaRepository },
    {
      provide: AUTHZ_PORT,
      useFactory: (identityAuthz) => identityAuthz,
      inject: [IDENTITY_AUTHZ_PORT],
    },
    JwtAuthGuard,
    CreateRoleUseCase,
    CreatePermissionUseCase,
    AttachPermissionUseCase,
    DetachPermissionUseCase,
    DeleteRoleUseCase,
    ListRolesUseCase,
    ListPermissionsUseCase,
    GetRolesForUserUseCase,
    GetAuditEntriesUseCase,
  ],
  exports: [
    GetRolesForUserUseCase,
    ROLE_REPO,
    PERM_REPO,
    'AuditRepositoryPort',
  ],
})
export class RbacModule {}
