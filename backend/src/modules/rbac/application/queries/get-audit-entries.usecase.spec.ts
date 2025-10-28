import { GetAuditEntriesUseCase } from './get-audit-entries.usecase';
import type { AuditRepositoryPort } from '../../domain/ports/audit.repository.port';
import type { AuditEntry } from '../../domain/entities/audit-entry.entity';

describe('GetAuditEntriesUseCase', () => {
  let useCase: GetAuditEntriesUseCase;
  let auditRepo: jest.Mocked<AuditRepositoryPort>;

  beforeEach(() => {
    auditRepo = {
      logAuditEntry: jest.fn(),
      getAuditEntriesByRole: jest.fn(),
    };
    useCase = new GetAuditEntriesUseCase(auditRepo);
  });

  it('should return audit entries for a given role', async () => {
    const fakeEntries: AuditEntry[] = [
      {
        id: '1',
        actorId: 'user-123',
        roleId: 'role-1',
        action: 'CREATE_ROLE',
        timestamp: new Date(),
        before: undefined,
        after: { id: 'role-1', name: 'Admin' },
        reason: 'Initial creation',
      },
    ];

    auditRepo.getAuditEntriesByRole.mockResolvedValue(fakeEntries);

    const result = await useCase.execute({ roleId: 'role-1' });

    expect(auditRepo.getAuditEntriesByRole).toHaveBeenCalledWith('role-1');
    expect(result).toEqual(fakeEntries);
  });
});
