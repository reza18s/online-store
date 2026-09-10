import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BadRequestException, ForbiddenException } from '@nestjs/common';

import type { AuthenticatedStaff } from '../auth/session.service';
import { AuditAdminService } from './audit-admin.service';
import { AdminAuditListQueryDto } from './dto/admin-audit-list.query';

interface AuditRow {
  id: string;
  actorType: 'CUSTOMER' | 'STAFF' | 'SYSTEM';
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: { reason: string } | null;
  createdAt: Date;
}

function staff(roles: AuthenticatedStaff['roles']): AuthenticatedStaff {
  return { id: 'staff-1', email: 'admin@nova.test', status: 'ACTIVE', roles };
}

function createService(rows: AuditRow[]) {
  const prisma = {
    auditEvent: {
      count: async ({ where }: { where: Record<string, string> }) =>
        rows.filter((row) => Object.entries(where).every(([key, value]) => row[key as keyof AuditRow] === value)).length,
      findMany: async ({
        where,
        skip,
        take,
      }: {
        where: Record<string, string>;
        skip: number;
        take: number;
      }) =>
        rows
          .filter((row) => Object.entries(where).every(([key, value]) => row[key as keyof AuditRow] === value))
          .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
          .slice(skip, skip + take),
    },
  };
  return new AuditAdminService({ prisma } as never);
}

test('admin audit reads are filtered and newest-first', async () => {
  const service = createService([
    {
      id: 'audit-1',
      actorType: 'STAFF',
      actorUserId: 'staff-1',
      action: 'order.cancelled',
      resourceType: 'Order',
      resourceId: 'order-1',
      metadata: { reason: 'test' },
      createdAt: new Date('2026-09-08T10:00:00Z'),
    },
    {
      id: 'audit-2',
      actorType: 'SYSTEM',
      actorUserId: null,
      action: 'payment.refund.failed',
      resourceType: 'Refund',
      resourceId: 'refund-1',
      metadata: null,
      createdAt: new Date('2026-09-08T11:00:00Z'),
    },
  ]);
  const query = Object.assign(new AdminAuditListQueryDto(), {
    action: 'payment.refund.failed',
    page: 1,
    limit: 24,
  });

  const result = await service.list(staff(['admin']), query);
  assert.equal(result.total, 1);
  assert.equal(result.items[0]?.id, 'audit-2');
});

test('audit reads are admin-only and validate identifiers', async () => {
  const service = createService([]);
  await assert.rejects(
    service.list(staff(['support']), new AdminAuditListQueryDto()),
    (error) => error instanceof ForbiddenException,
  );

  const query = Object.assign(new AdminAuditListQueryDto(), { actorUserId: 'not valid' });
  await assert.rejects(
    service.list(staff(['admin']), query),
    (error) => error instanceof BadRequestException,
  );
});
