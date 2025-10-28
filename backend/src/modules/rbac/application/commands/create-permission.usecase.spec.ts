import { CreatePermissionUseCase } from './create-permission.usecase';
import type { PermissionRepositoryPort } from '../../domain/ports/permission.repository.port';
import type { AuthorizationPort } from '../../../identity/domain/ports/authorization.port';
import { Permission } from '../../domain/entities/permission.entity';
import { ForbiddenException } from '@nestjs/common';

describe('CreatePermissionUseCase', () => {
  function makeRepoMock(overrides: Partial<PermissionRepositoryPort> = {}): PermissionRepositoryPort {
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

  it('creates a permission when user is admin and permission does not exist', async () => {
    const repo = makeRepoMock({
      findByActionResource: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation(async (action: string, resource: string, description?: string | null) => new Permission('p1', action, resource, description ?? null)),
    });
    const authz = makeAuthzMock({
      hasRole: jest.fn().mockResolvedValue(true), 
      hasPermission: jest.fn().mockResolvedValue(false),
    });

    const usecase = new CreatePermissionUseCase(repo, authz);
    const result = await usecase.execute({
      action: 'read',
      resource: 'document',
      description: 'read documents',
      userId: 'admin-user-id'
    });

    expect(authz.hasRole).toHaveBeenCalledWith('admin-user-id', 'admin');
    expect(repo.findByActionResource).toHaveBeenCalledWith('read', 'document');
    expect(repo.create).toHaveBeenCalledWith('read', 'document', 'read documents');
    expect(result).toEqual(new Permission('p1', 'read', 'document', 'read documents'));
  });

  it('creates a permission when user has manage permissions on permissions', async () => {
    const repo = makeRepoMock({
      findByActionResource: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation(async (action: string, resource: string, description?: string | null) => new Permission('p1', action, resource, description ?? null)),
    });
    const authz = makeAuthzMock({
      hasRole: jest.fn().mockResolvedValue(false), 
      hasPermission: jest.fn().mockResolvedValue(true), 
    });

    const usecase = new CreatePermissionUseCase(repo, authz);
    const result = await usecase.execute({
      action: 'read',
      resource: 'document',
      userId: 'authorized-user-id'
    });

    expect(authz.hasRole).toHaveBeenCalledWith('authorized-user-id', 'admin');
    expect(authz.hasPermission).toHaveBeenCalledWith('authorized-user-id', 'manage', 'permissions');
    expect(result).toEqual(new Permission('p1', 'read', 'document', null));
  });

  it('throws ForbiddenException when user lacks authorization', async () => {
    const repo = makeRepoMock();
    const authz = makeAuthzMock({
      hasRole: jest.fn().mockResolvedValue(false), 
      hasPermission: jest.fn().mockResolvedValue(false), 
      requiresRole: jest.fn().mockRejectedValue(new ForbiddenException("Acceso denegado: Se requiere el rol 'admin'")),
    });

    const usecase = new CreatePermissionUseCase(repo, authz);

    await expect(usecase.execute({
      action: 'read',
      resource: 'document',
      userId: 'unauthorized-user-id'
    })).rejects.toThrow(ForbiddenException);

    expect(authz.hasRole).toHaveBeenCalledWith('unauthorized-user-id', 'admin');
    expect(authz.hasPermission).toHaveBeenCalledWith('unauthorized-user-id', 'manage', 'permissions');
    expect(authz.requiresRole).toHaveBeenCalledWith('unauthorized-user-id', 'admin');
  });

  it('throws if permission already exists even with authorization', async () => {
    const existing = new Permission('p0', 'read', 'document', 'existing');
    const repo = makeRepoMock({
      findByActionResource: jest.fn().mockResolvedValue(existing),
    });
    const authz = makeAuthzMock({
      hasRole: jest.fn().mockResolvedValue(true),
    });

    const usecase = new CreatePermissionUseCase(repo, authz);

    await expect(usecase.execute({
      action: 'read',
      resource: 'document',
      userId: 'admin-user-id'
    })).rejects.toThrow('Permission already exists');

    expect(authz.hasRole).toHaveBeenCalledWith('admin-user-id', 'admin');
    expect(repo.findByActionResource).toHaveBeenCalledWith('read', 'document');
  });
});
