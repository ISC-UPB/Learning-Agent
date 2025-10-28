import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { RbacModule } from '../../rbac.module';
import { AuditRepositoryPort } from '../../domain/ports/audit.repository.port';
import type { AuditEntry } from '../../domain/entities/audit-entry.entity';

describe('RbacController (integration)', () => {
  let app: INestApplication;
  let auditRepo: jest.Mocked<AuditRepositoryPort>;

  beforeAll(async () => {
    auditRepo = {
      logAuditEntry: jest.fn(),
      getAuditEntriesByRole: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RbacModule],
    })
      .overrideProvider('AuditRepositoryPort')
      .useValue(auditRepo)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /rbac/audit should return audit entries', async () => {
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

    const response = await request(app.getHttpServer())
      .get('/rbac/audit')
      .query({ roleId: 'role-1' })
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actorId: 'user-123',
          roleId: 'role-1',
          action: 'CREATE_ROLE',
        }),
      ]),
    );
    expect(auditRepo.getAuditEntriesByRole).toHaveBeenCalledWith('role-1');
  });
});
