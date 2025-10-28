import { CreateRoleUseCase } from './create-role.usecase';
import type { RoleRepositoryPort } from '../../domain/ports/role.repository.port';
import type { AuditRepositoryPort } from '../../domain/ports/audit.repository.port';
import type { AuthorizationPort } from '../../../identity/domain/ports/authorization.port';
import { Role } from '../../domain/entities/role.entity';
import { ForbiddenException } from '@nestjs/common';

describe('CreateRoleUseCase', () => {
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

  function makeAuditRepoMock(overrides: Partial<AuditRepositoryPort> = {}): AuditRepositoryPort {
    return {
      logAuditEntry: jest.fn(),
      getAuditEntriesByRole: jest.fn(),
      ...overrides,
    } as unknown as AuditRepositoryPort;
  }

  it('creates a role and logs audit entry when name is unique and user is admin', async () => {
    const roleRepo = makeRoleRepoMock({
      findByName: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(
        async (name: string, description?: string | null) =>
          new Role('r1', name, description ?? null),
      ),
    });
    const authz = makeAuthzMock({
      hasRole: jest.fn().mockResolvedValue(true),
      hasPermission: jest.fn().mockResolvedValue(false),
    });
    const auditRepo = makeAuditRepoMock();

    const usecase = new CreateRoleUseCase(roleRepo, authz, auditRepo);
    const result = await usecase.execute({
      name: 'docente',
      description: 'Teacher role',
      actorId: 'admin-user-id',
    });

    expect(authz.hasRole).toHaveBeenCalledWith('admin-user-id', 'admin');
    expect(roleRepo.findByName).toHaveBeenCalledWith('docente');
    expect(roleRepo.create).toHaveBeenCalledWith('docente', 'Teacher role');
    expect(result).toEqual(new Role('r1', 'docente', 'Teacher role'));
    expect(auditRepo.logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'admin-user-id',
        action: 'CREATE_ROLE',
        roleId: 'r1',
      }),
    );
  });

  it('creates a role when user has manage permissions on roles', async () => {
    const roleRepo = makeRoleRepoMock({
      findByName: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(
        async (name: string, description?: string | null) =>
          new Role('r1', name, description ?? null),
      ),
    });
    const authz = makeAuthzMock({
      hasRole: jest.fn().mockResolvedValue(false),
      hasPermission: jest.fn().mockResolvedValue(true),
    });
    const auditRepo = makeAuditRepoMock();

    const usecase = new CreateRoleUseCase(roleRepo, authz, auditRepo);
    const result = await usecase.execute({
      name: 'docente',
      description: 'Teacher role',
      actorId: 'authorized-user-id',
    });

    expect(authz.hasRole).toHaveBeenCalledWith('authorized-user-id', 'admin');
    expect(authz.hasPermission).toHaveBeenCalledWith('authorized-user-id', 'manage', 'roles');
    expect(roleRepo.create).toHaveBeenCalledWith('docente', 'Teacher role');
    expect(result).toEqual(new Role('r1', 'docente', 'Teacher role'));
    expect(auditRepo.logAuditEntry).toHaveBeenCalled();
  });

  it('throws ForbiddenException when user lacks authorization', async () => {
    const roleRepo = makeRoleRepoMock();
    const authz = makeAuthzMock({
      hasRole: jest.fn().mockResolvedValue(false),
      hasPermission: jest.fn().mockResolvedValue(false),
      requiresRole: jest.fn().mockRejectedValue(
        new ForbiddenException("Acceso denegado: Se requiere el rol 'admin'"),
      ),
    });
    const auditRepo = makeAuditRepoMock();

    const usecase = new CreateRoleUseCase(roleRepo, authz, auditRepo);

    await expect(
      usecase.execute({
        name: 'docente',
        actorId: 'unauthorized-user-id',
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(authz.hasRole).toHaveBeenCalledWith('unauthorized-user-id', 'admin');
    expect(authz.hasPermission).toHaveBeenCalledWith('unauthorized-user-id', 'manage', 'roles');
    expect(authz.requiresRole).toHaveBeenCalledWith('unauthorized-user-id', 'admin');
    expect(auditRepo.logAuditEntry).not.toHaveBeenCalled();
  });

  it('throws if role name already exists even with authorization', async () => {
    const existing = new Role('r0', 'docente', 'existing');
    const roleRepo = makeRoleRepoMock({
      findByName: jest.fn().mockResolvedValue(existing),
    });
    const authz = makeAuthzMock({
      hasRole: jest.fn().mockResolvedValue(true),
    });
    const auditRepo = makeAuditRepoMock();

    const usecase = new CreateRoleUseCase(roleRepo, authz, auditRepo);

    await expect(
      usecase.execute({
        name: 'docente',
        actorId: 'admin-user-id',
      }),
    ).rejects.toThrow('Role name already exists');

    expect(authz.hasRole).toHaveBeenCalledWith('admin-user-id', 'admin');
    expect(roleRepo.findByName).toHaveBeenCalledWith('docente');
    expect(auditRepo.logAuditEntry).not.toHaveBeenCalled();
  });
});
