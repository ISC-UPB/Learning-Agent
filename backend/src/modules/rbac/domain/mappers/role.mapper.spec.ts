import { RoleMapper, RolePersistenceRecord, CreateRoleData } from './role.mapper';
import { Role } from '../entities/role.entity';

describe('RoleMapper', () => {
  describe('toDomain', () => {
    it('should convert persistence record to domain entity', () => {
      const record: RolePersistenceRecord = {
        id: 'role-1',
        name: 'admin',
        description: 'Administrator role',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = RoleMapper.toDomain(record);

      expect(result).toBeInstanceOf(Role);
      expect(result.id).toBe('role-1');
      expect(result.name).toBe('admin');
      expect(result.description).toBe('Administrator role');
    });

    it('should handle null description', () => {
      const record: RolePersistenceRecord = {
        id: 'role-1',
        name: 'user',
        description: null,
      };

      const result = RoleMapper.toDomain(record);

      expect(result.description).toBeNull();
    });
  });

  describe('toDomainList', () => {
    it('should convert multiple persistence records to domain entities', () => {
      const records: RolePersistenceRecord[] = [
        { id: 'role-1', name: 'admin', description: 'Admin role' },
        { id: 'role-2', name: 'user', description: null },
      ];

      const result = RoleMapper.toDomainList(records);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Role);
      expect(result[0].id).toBe('role-1');
      expect(result[1]).toBeInstanceOf(Role);
      expect(result[1].id).toBe('role-2');
    });

    it('should return empty array for empty input', () => {
      const result = RoleMapper.toDomainList([]);

      expect(result).toEqual([]);
    });
  });

  describe('toPersistenceCreate', () => {
    it('should convert create data to persistence format', () => {
      const data: CreateRoleData = {
        name: 'moderator',
        description: 'Moderator role',
      };

      const result = RoleMapper.toPersistenceCreate(data);

      expect(result).toEqual({
        name: 'moderator',
        description: 'Moderator role',
      });
    });

    it('should handle undefined description', () => {
      const data: CreateRoleData = {
        name: 'guest',
      };

      const result = RoleMapper.toPersistenceCreate(data);

      expect(result).toEqual({
        name: 'guest',
        description: null,
      });
    });

    it('should handle explicit null description', () => {
      const data: CreateRoleData = {
        name: 'guest',
        description: null,
      };

      const result = RoleMapper.toPersistenceCreate(data);

      expect(result).toEqual({
        name: 'guest',
        description: null,
      });
    });
  });

  describe('toPersistenceUpdate', () => {
    it('should convert domain entity to persistence update format', () => {
      const role = new Role('role-1', 'updated-admin', 'Updated admin role');

      const result = RoleMapper.toPersistenceUpdate(role);

      expect(result).toEqual({
        name: 'updated-admin',
        description: 'Updated admin role',
      });
    });

    it('should handle null description in domain entity', () => {
      const role = new Role('role-1', 'basic-user', null);

      const result = RoleMapper.toPersistenceUpdate(role);

      expect(result).toEqual({
        name: 'basic-user',
        description: null,
      });
    });

    it('should handle undefined description in domain entity', () => {
      const role = new Role('role-1', 'basic-user');

      const result = RoleMapper.toPersistenceUpdate(role);

      expect(result).toEqual({
        name: 'basic-user',
        description: null,
      });
    });
  });
});