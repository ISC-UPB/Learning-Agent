import { AttachPermissionUseCase } from './attach-permission.usecase';
import type { RoleRepositoryPort } from '../../domain/ports/role.repository.port';
import type { PermissionRepositoryPort } from '../../domain/ports/permission.repository.port';
import type { AuthorizationPort } from '../../../identity/domain/ports/authorization.port';
import { Role } from '../../domain/entities/role.entity';
import { Permission } from '../../domain/entities/permission.entity';
import { ForbiddenException } from '@nestjs/common';

describe('AttachPermissionUseCase', () => {
  function makeRoleRepoMock(overrides: Partial<RoleRepositoryPort> = {}): RoleRepositoryPort {
    return {
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      list: jest.fn(),
      attachPermission: jest.fn(),
      listForUser: jest.fn(),
      getPermissionsForUser: jest.fn(),
      ...overrides,
    } as unknown as RoleRepositoryPort;
  }

  function makePermRepoMock(overrides: Partial<PermissionRepositoryPort> = {}): PermissionRepositoryPort {
    return {
      findById: jest.fn(),
      findByActionResource: jest.fn(),
      create: jest.fn(),
      list: jest.fn(),
      ...overrides,
    } as unknown as PermissionRepositoryPort;
  }

  function makeAuthzMock(overrides: Partial<AuthorizationPort> = {}): AuthorizationPort {
    return {
      getRolesForUser: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: jest.fn(),
      requiresRole: jest.fn(),
      requiresPermission: jest.fn(),
      ...overrides,
    } as unknown as AuthorizationPort;
  }

  it('attaches permission when user is admin and role and permission exist', async () => {
    const roleRepo = makeRoleRepoMock({
      findById: jest.fn().mockResolvedValue(new Role('r1', 'docente', null)),
      attachPermission: jest.fn().mockResolvedValue(undefined),
    });
    const permRepo = makePermRepoMock({
      findById: jest.fn().mockResolvedValue(new Permission('p1', 'read', 'document', null)),
    });
    const authz = makeAuthzMock({
      hasRole: jest.fn().mockResolvedValue(true), 
      hasPermission: jest.fn().mockResolvedValue(false),
    });

    const usecase = new AttachPermissionUseCase(roleRepo, permRepo, authz);
    const output = await usecase.execute({
      roleId: 'r1',
      permissionId: 'p1',
      userId: 'admin-user-id'
    });

    expect(authz.hasRole).toHaveBeenCalledWith('admin-user-id', 'admin');
    expect(roleRepo.findById).toHaveBeenCalledWith('r1');
    expect(permRepo.findById).toHaveBeenCalledWith('p1');
    expect(roleRepo.attachPermission).toHaveBeenCalledWith('r1', 'p1');
    expect(output).toEqual({ ok: true });
  });

  it('attaches permission when user has manage permissions on permissions', async () => {
    const roleRepo = makeRoleRepoMock({
      findById: jest.fn().mockResolvedValue(new Role('r1', 'docente', null)),
      attachPermission: jest.fn().mockResolvedValue(undefined),
    });
    const permRepo = makePermRepoMock({
      findById: jest.fn().mockResolvedValue(new Permission('p1', 'read', 'document', null)),
    });
    const authz = makeAuthzMock({
      hasRole: jest.fn().mockResolvedValue(false), 
      hasPermission: jest.fn().mockResolvedValue(true), 
    });

    const usecase = new AttachPermissionUseCase(roleRepo, permRepo, authz);
    const output = await usecase.execute({
      roleId: 'r1',
      permissionId: 'p1',
      userId: 'authorized-user-id'
    });

    expect(authz.hasRole).toHaveBeenCalledWith('authorized-user-id', 'admin');
    expect(authz.hasPermission).toHaveBeenCalledWith('authorized-user-id', 'manage', 'permissions');
    expect(output).toEqual({ ok: true });
  });

  it('throws ForbiddenException when user lacks authorization', async () => {
    const roleRepo = makeRoleRepoMock();
    const permRepo = makePermRepoMock();
    const authz = makeAuthzMock({
      hasRole: jest.fn().mockResolvedValue(false), 
      hasPermission: jest.fn().mockResolvedValue(false), 
      requiresRole: jest.fn().mockRejectedValue(new ForbiddenException("Acceso denegado: Se requiere el rol 'admin'")),
    });

    const usecase = new AttachPermissionUseCase(roleRepo, permRepo, authz);

    await expect(usecase.execute({
      roleId: 'r1',
      permissionId: 'p1',
      userId: 'unauthorized-user-id'
    })).rejects.toThrow(ForbiddenException);

    expect(authz.hasRole).toHaveBeenCalledWith('unauthorized-user-id', 'admin');
    expect(authz.hasPermission).toHaveBeenCalledWith('unauthorized-user-id', 'manage', 'permissions');
    expect(authz.requiresRole).toHaveBeenCalledWith('unauthorized-user-id', 'admin');
  });

  it('throws if role not found even with authorization', async () => {
    const roleRepo = makeRoleRepoMock({ findById: jest.fn().mockResolvedValue(null) });
    const permRepo = makePermRepoMock({ findById: jest.fn().mockResolvedValue(new Permission('p1', 'read', 'document', null)) });
    const authz = makeAuthzMock({
      hasRole: jest.fn().mockResolvedValue(true), 
    });

    const usecase = new AttachPermissionUseCase(roleRepo, permRepo, authz);

    await expect(usecase.execute({
      roleId: 'r-missing',
      permissionId: 'p1',
      userId: 'admin-user-id'
    })).rejects.toThrow('Role not found');

    expect(authz.hasRole).toHaveBeenCalledWith('admin-user-id', 'admin');
    expect(roleRepo.findById).toHaveBeenCalledWith('r-missing');
  });

  it('throws if permission not found even with authorization', async () => {
    const roleRepo = makeRoleRepoMock({ findById: jest.fn().mockResolvedValue(new Role('r1', 'docente', null)) });
    const permRepo = makePermRepoMock({ findById: jest.fn().mockResolvedValue(null) });
    const authz = makeAuthzMock({
      hasRole: jest.fn().mockResolvedValue(true), 
    });

    const usecase = new AttachPermissionUseCase(roleRepo, permRepo, authz);

    await expect(usecase.execute({
      roleId: 'r1',
      permissionId: 'p-missing',
      userId: 'admin-user-id'
    })).rejects.toThrow('Permission not found');

    expect(authz.hasRole).toHaveBeenCalledWith('admin-user-id', 'admin');
    expect(permRepo.findById).toHaveBeenCalledWith('p-missing');
  });
});

