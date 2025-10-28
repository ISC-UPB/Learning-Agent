import { AuditPrismaRepository } from './audit.prisma.repository';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import type { AuditEntry } from '../../domain/entities/audit-entry.entity';

describe('AuditPrismaRepository', () => {
  let repo: AuditPrismaRepository;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      rbacAudit: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    } as any;
    repo = new AuditPrismaRepository(prisma);
  });

  it('should log an audit entry', async () => {
    const entry: AuditEntry = {
      id: '1',
      actorId: 'user-123',
      roleId: 'role-1',
      action: 'DELETE_ROLE',
      timestamp: new Date(),
      before: { id: 'role-1', name: 'Admin' },
      after: undefined,
      reason: 'Role deleted',
    };

    await repo.logAuditEntry(entry);

    expect(prisma.rbacAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'user-123',
        roleId: 'role-1',
        action: 'DELETE_ROLE',
      }),
    });
  });

  it('should map rows from prisma to AuditEntry[]', async () => {
    const now = new Date();
    prisma.rbacAudit.findMany.mockResolvedValue([
      {
        id: '1',
        actorId: 'user-123',
        roleId: 'role-1',
        action: 'CREATE_ROLE',
        timestamp: now,
        before: { foo: 'bar' },
        after: { foo: 'baz' },
        reason: 'test',
      },
    ]);

    const result = await repo.getAuditEntriesByRole('role-1');

    expect(prisma.rbacAudit.findMany).toHaveBeenCalledWith({
      where: { roleId: 'role-1' },
      orderBy: { timestamp: 'desc' },
    });
    expect(result[0]).toMatchObject({
      id: '1',
      actorId: 'user-123',
      roleId: 'role-1',
      action: 'CREATE_ROLE',
      before: { foo: 'bar' },
      after: { foo: 'baz' },
      reason: 'test',
    });
  });
});
