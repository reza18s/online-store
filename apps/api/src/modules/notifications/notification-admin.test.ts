import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { DatabaseService } from '../../database/database.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { AdminNotificationListQueryDto } from './dto/admin-notification-list.query';
import { NotificationAdminService } from './notification-admin.service';

function staff(roles: string[]): AuthenticatedStaff {
  return { id: 'staff-1', email: 'staff@example.test', status: 'ACTIVE', roles };
}

test('operations can inspect notification delivery state without sensitive job fields', async () => {
  let receivedSelect: Record<string, unknown> | undefined;
  const database = {
    prisma: {
      notificationJob: {
        count: async () => 1,
        findMany: async (args: { select: Record<string, unknown> }) => {
          receivedSelect = args.select;
          return [
            {
              id: 'job-1',
              kind: 'PAYMENT_SUCCEEDED',
              status: 'SENT' as const,
              attempts: 1,
              availableAt: new Date('2026-01-01T00:00:00.000Z'),
              processedAt: new Date('2026-01-01T00:01:00.000Z'),
              lastError: null,
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
            },
          ];
        },
      },
    },
  } as unknown as DatabaseService;
  const query = Object.assign(new AdminNotificationListQueryDto(), {
    kind: 'PAYMENT_SUCCEEDED',
    status: 'SENT',
  });

  const result = await new NotificationAdminService(database).listForStaff(
    staff(['operations']),
    query,
  );

  assert.equal(result.total, 1);
  assert.equal(result.items[0]?.status, 'SENT');
  assert.equal(result.items[0]?.lastError, null);
  assert.equal(receivedSelect?.recipient, undefined);
  assert.equal(receivedSelect?.payload, undefined);
  assert.equal(receivedSelect?.dedupeKey, undefined);
});

test('support staff cannot inspect notification delivery jobs', async () => {
  const database = {
    prisma: { notificationJob: { count: async () => 0, findMany: async () => [] } },
  } as unknown as DatabaseService;
  await assert.rejects(
    new NotificationAdminService(database).listForStaff(
      staff(['support']),
      Object.assign(new AdminNotificationListQueryDto(), {}),
    ),
    { message: 'دسترسی لازم برای این عملیات را ندارید.' },
  );
});
