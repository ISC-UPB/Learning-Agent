import { Role } from '../entities/role.entity';

export interface RolePersistenceRecord {
  id: string;
  name: string;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateRoleData {
  name: string;
  description?: string | null;
}

export class RoleMapper {

  static toDomain(record: RolePersistenceRecord): Role {
    return new Role(record.id, record.name, record.description);
  }

  static toDomainList(records: RolePersistenceRecord[]): Role[] {
    return records.map(record => this.toDomain(record));
  }

  static toPersistenceCreate(data: CreateRoleData): {
    name: string;
    description: string | null;
  } {
    return {
      name: data.name,
      description: data.description ?? null,
    };
  }

  static toPersistenceUpdate(role: Role): {
    name: string;
    description: string | null;
  } {
    return {
      name: role.name,
      description: role.description ?? null,
    };
  }
}