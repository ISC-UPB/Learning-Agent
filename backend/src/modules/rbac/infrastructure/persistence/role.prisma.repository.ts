import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { RoleRepositoryPort } from '../../domain/ports/role.repository.port';
import { Role } from '../../domain/entities/role.entity';
import { Permission } from '../../domain/entities/permission.entity';
import {
  RoleNotFoundError,
  PermissionNotFoundError,
  RoleTransactionError,
} from '../../domain/errors/role.errors';
import { RoleMapper } from '../../domain/mappers';

@Injectable()
export class RolePrismaRepository implements RoleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: { users: { some: { userId } } },
    });
    return RoleMapper.toDomainList(roles);
  }

  async findById(id: string): Promise<Role | null> {
    const r = await this.prisma.role.findUnique({ where: { id } });
    return r ? RoleMapper.toDomain(r) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const r = await this.prisma.role.findUnique({ where: { name } });
    return r ? RoleMapper.toDomain(r) : null;
  }

  async create(name: string, description?: string | null): Promise<Role> {
    try {
      const createData = RoleMapper.toPersistenceCreate({ name, description });
      const r = await this.prisma.role.create({ data: createData });
      return RoleMapper.toDomain(r);
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new RoleTransactionError(`El rol "${name}" ya existe.`);
      }
      throw new RoleTransactionError(err.message);
    }
  }

  async list(): Promise<Role[]> {
    const rows = await this.prisma.role.findMany({ orderBy: { name: 'asc' } });
    return RoleMapper.toDomainList(rows);
  }

  async createWithPermissions(
    name: string,
    description: string | null,
    permissionIds: string[],
  ): Promise<Role> {
    try {
      const role = await this.prisma.$transaction(async (tx) => {
        const createData = RoleMapper.toPersistenceCreate({ name, description });
        const createdRole = await tx.role.create({
          data: createData,
        });

        if (permissionIds?.length > 0) {
          const foundPermissions = await tx.permission.findMany({
            where: { id: { in: permissionIds } },
            select: { id: true },
          });

          const foundIds = foundPermissions.map((p) => p.id);
          const missing = permissionIds.filter((id) => !foundIds.includes(id));

          if (missing.length > 0) {
            throw new PermissionNotFoundError(missing);
          }

          await tx.rolePermission.createMany({
            data: permissionIds.map((pid) => ({
              roleId: createdRole.id,
              permissionId: pid,
            })),
            skipDuplicates: true,
          });
        }

        return createdRole;
      });

      return RoleMapper.toDomain(role);
    } catch (err: any) {
      if (err instanceof PermissionNotFoundError) throw err;
      throw new RoleTransactionError(err.message);
    }
  }

  async attachPermission(roleId: string, permissionId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const role = await tx.role.findUnique({ where: { id: roleId } });
        if (!role) throw new RoleNotFoundError(roleId);

        const perm = await tx.permission.findUnique({ where: { id: permissionId } });
        if (!perm) throw new PermissionNotFoundError([permissionId]);

        await tx.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId } },
          create: { roleId, permissionId },
          update: {},
        });
      });
    } catch (err: any) {
      if (err instanceof RoleNotFoundError || err instanceof PermissionNotFoundError)
        throw err;
      throw new RoleTransactionError(`Fallo al asociar permiso: ${err.message}`);
    }
  }

  async detachPermission(roleId: string, permissionId: string): Promise<void> {
    await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({ where: { id } });
  }

  async getPermissionsForUser(userId: string): Promise<Permission[]> {
    const permissions = await this.prisma.permission.findMany({
      where: {
        roles: {
          some: {
            role: {
              users: {
                some: { userId },
              },
            },
          },
        },
      },
      distinct: ['id'],
    });

    return permissions.map(
      (p) => new Permission(p.id, p.action, p.resource, p.description),
    );
  }
}
