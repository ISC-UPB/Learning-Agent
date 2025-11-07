import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { PermissionRepositoryPort } from '../../domain/ports/permission.repository.port';
import { Permission } from '../../domain/entities/permission.entity';
import { PermissionMapper } from '../../domain/mappers';

@Injectable()
export class PermissionPrismaRepository implements PermissionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}
  async findById(id: string) {
    const p = await this.prisma.permission.findUnique({ where: { id } });
    return p ? PermissionMapper.toDomain(p) : null;
  }
  async findByActionResource(action: string, resource: string) {
    const p = await this.prisma.permission.findUnique({
      where: { action_resource: { action, resource } },
    });
    return p ? PermissionMapper.toDomain(p) : null;
  }
  async create(action: string, resource: string, description?: string | null) {
    const createData = PermissionMapper.toPersistenceCreate({ action, resource, description });
    const p = await this.prisma.permission.create({
      data: createData,
    });
    return PermissionMapper.toDomain(p);
  }
  async list() {
    const rows = await this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
    return PermissionMapper.toDomainList(rows);
  }
}
