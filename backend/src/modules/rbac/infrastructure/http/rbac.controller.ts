import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CreateRoleUseCase } from '../../application/commands/create-role.usecase';
import { CreatePermissionUseCase } from '../../application/commands/create-permission.usecase';
import { AttachPermissionUseCase } from '../../application/commands/attach-permission.usecase';
import { DetachPermissionUseCase } from '../../application/commands/detach-permission.usecase';
import { DeleteRoleUseCase } from '../../application/commands/delete-role.usecase';
import { ListRolesUseCase } from '../../application/queries/list-roles.usecase';
import { ListPermissionsUseCase } from '../../application/queries/list-permissions.usecase';
import { GetAuditEntriesUseCase } from '../../application/queries/get-audit-entries.usecase';
import { CreateRoleDto } from './dtos/create-role.dto';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('rbac')
export class RbacController {
  constructor(
    private readonly createRole: CreateRoleUseCase,
    private readonly createPerm: CreatePermissionUseCase,
    private readonly attachPerm: AttachPermissionUseCase,
    private readonly detachPerm: DetachPermissionUseCase,
    private readonly deleteRole: DeleteRoleUseCase,
    private readonly listRoles: ListRolesUseCase,
    private readonly listPerms: ListPermissionsUseCase,
    private readonly getAuditEntries: GetAuditEntriesUseCase,
  ) {}

  @Post('roles')
  createRoleEndpoint(@Body() dto: CreateRoleDto, @Req() req: Request) {
    const actorId = (req.user as any)?.sub;
    return this.createRole.execute({ ...dto, actorId });
  }

  @Post('permissions')
  createPermEndpoint(@Body() dto: CreatePermissionDto, @Req() req: Request) {
    const userId = (req.user as any)?.sub;
    return this.createPerm.execute({ ...dto, userId });
  }

  @Post('roles/:roleId/permissions/:permissionId')
  attachPermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @Req() req: Request,
  ) {
    const actorId = (req.user as any)?.sub;
    return this.attachPerm.execute({ roleId, permissionId, actorId });
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  detachPermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @Req() req: Request,
  ) {
    const actorId = (req.user as any)?.sub;
    return this.detachPerm.execute({ roleId, permissionId, actorId });
  }

  @Delete('roles/:roleId')
  deleteRoleEndpoint(@Param('roleId') roleId: string, @Req() req: Request) {
    const actorId = (req.user as any)?.sub;
    return this.deleteRole.execute({ roleId, actorId });
  }

  @Get('roles')
  listRolesEndpoint() {
    return this.listRoles.execute();
  }

  @Get('permissions')
  listPermsEndpoint() {
    return this.listPerms.execute();
  }

  @Get('audit')
  getAudit(@Query('roleId') roleId: string) {
    return this.getAuditEntries.execute({ roleId });
  }
}
