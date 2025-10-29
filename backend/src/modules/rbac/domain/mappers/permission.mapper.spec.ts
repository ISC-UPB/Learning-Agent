import { PermissionMapper, PermissionPersistenceRecord, CreatePermissionData } from './permission.mapper';
import { Permission } from '../entities/permission.entity';

describe('PermissionMapper', () => {
  describe('toDomain', () => {
    it('should convert persistence record to domain entity', () => {
      const record: PermissionPersistenceRecord = {
        id: 'perm-1',
        action: 'read',
        resource: 'documents',
        description: 'Read documents permission',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = PermissionMapper.toDomain(record);

      expect(result).toBeInstanceOf(Permission);
      expect(result.id).toBe('perm-1');
      expect(result.action).toBe('read');
      expect(result.resource).toBe('documents');
      expect(result.description).toBe('Read documents permission');
    });

    it('should handle null description', () => {
      const record: PermissionPersistenceRecord = {
        id: 'perm-1',
        action: 'write',
        resource: 'files',
        description: null,
      };

      const result = PermissionMapper.toDomain(record);

      expect(result.description).toBeNull();
    });
  });

  describe('toDomainList', () => {
    it('should convert multiple persistence records to domain entities', () => {
      const records: PermissionPersistenceRecord[] = [
        { id: 'perm-1', action: 'read', resource: 'docs', description: 'Read docs' },
        { id: 'perm-2', action: 'write', resource: 'files', description: null },
      ];

      const result = PermissionMapper.toDomainList(records);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Permission);
      expect(result[0].id).toBe('perm-1');
      expect(result[1]).toBeInstanceOf(Permission);
      expect(result[1].id).toBe('perm-2');
    });

    it('should return empty array for empty input', () => {
      const result = PermissionMapper.toDomainList([]);

      expect(result).toEqual([]);
    });
  });

  describe('toPersistenceCreate', () => {
    it('should convert create data to persistence format', () => {
      const data: CreatePermissionData = {
        action: 'delete',
        resource: 'users',
        description: 'Delete users permission',
      };

      const result = PermissionMapper.toPersistenceCreate(data);

      expect(result).toEqual({
        action: 'delete',
        resource: 'users',
        description: 'Delete users permission',
      });
    });

    it('should handle undefined description', () => {
      const data: CreatePermissionData = {
        action: 'create',
        resource: 'posts',
      };

      const result = PermissionMapper.toPersistenceCreate(data);

      expect(result).toEqual({
        action: 'create',
        resource: 'posts',
        description: null,
      });
    });

    it('should handle explicit null description', () => {
      const data: CreatePermissionData = {
        action: 'update',
        resource: 'comments',
        description: null,
      };

      const result = PermissionMapper.toPersistenceCreate(data);

      expect(result).toEqual({
        action: 'update',
        resource: 'comments',
        description: null,
      });
    });
  });

  describe('toPersistenceUpdate', () => {
    it('should convert domain entity to persistence update format', () => {
      const permission = new Permission('perm-1', 'manage', 'projects', 'Manage projects');

      const result = PermissionMapper.toPersistenceUpdate(permission);

      expect(result).toEqual({
        action: 'manage',
        resource: 'projects',
        description: 'Manage projects',
      });
    });

    it('should handle null description in domain entity', () => {
      const permission = new Permission('perm-1', 'view', 'reports', null);

      const result = PermissionMapper.toPersistenceUpdate(permission);

      expect(result).toEqual({
        action: 'view',
        resource: 'reports',
        description: null,
      });
    });

    it('should handle undefined description in domain entity', () => {
      const permission = new Permission('perm-1', 'export', 'data');

      const result = PermissionMapper.toPersistenceUpdate(permission);

      expect(result).toEqual({
        action: 'export',
        resource: 'data',
        description: null,
      });
    });
  });
});