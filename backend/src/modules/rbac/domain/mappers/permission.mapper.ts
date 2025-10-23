import { Permission } from '../entities/permission.entity';

export interface PermissionPersistenceRecord {
  id: string;
  action: string;
  resource: string;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePermissionData {
  action: string;
  resource: string;
  description?: string | null;
}

export class PermissionMapper {
  
  static toDomain(record: PermissionPersistenceRecord): Permission {
    return new Permission(record.id, record.action, record.resource, record.description);
  }

  
  static toDomainList(records: PermissionPersistenceRecord[]): Permission[] {
    return records.map(record => this.toDomain(record));
  }

  static toPersistenceCreate(data: CreatePermissionData): {
    action: string;
    resource: string;
    description: string | null;
  } {
    return {
      action: data.action,
      resource: data.resource,
      description: data.description ?? null,
    };
  }

  
  static toPersistenceUpdate(permission: Permission): {
    action: string;
    resource: string;
    description: string | null;
  } {
    return {
      action: permission.action,
      resource: permission.resource,
      description: permission.description ?? null,
    };
  }
}