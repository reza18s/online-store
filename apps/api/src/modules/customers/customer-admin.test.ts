import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { DatabaseService } from '../../database/database.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { AdminCustomerListQueryDto } from './dto/admin-customer-list.query';
import { CustomerAdminService } from './customer-admin.service';

function staff(roles: string[]): AuthenticatedStaff {
  return { id: 'staff-1', email: 'staff@example.test', status: 'ACTIVE', roles };
}

test('support lookup excludes staff accounts and returns safe latest-order context', async () => {
  let receivedWhere: Record<string, unknown> | undefined;
  const database = {
    prisma: {
      user: {
        count: async (args: { where: Record<string, unknown> }) => {
          receivedWhere = args.where;
          return 1;
        },
        findMany: async () => [
          {
            id: 'customer-1',
            phone: '+989121234567',
            email: 'customer@example.test',
            status: 'ACTIVE' as const,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-02T00:00:00.000Z'),
            _count: { orders: 2 },
            orders: [
              {
                orderNumber: 'NV-001',
                status: 'SHIPPED' as const,
                createdAt: new Date('2026-01-03T00:00:00.000Z'),
              },
            ],
          },
        ],
      },
    },
  } as unknown as DatabaseService;
  const query = Object.assign(new AdminCustomerListQueryDto(), {
    q: '  ۰۹۱۲  ',
    page: 2,
    limit: 12,
  });

  const result = await new CustomerAdminService(database).listForStaff(staff(['support']), query);

  assert.equal(result.total, 1);
  assert.equal(result.page, 2);
  assert.equal(result.limit, 12);
  assert.deepEqual(result.items[0], {
    id: 'customer-1',
    phone: '+989121234567',
    email: 'customer@example.test',
    status: 'ACTIVE',
    orderCount: 2,
    lastOrderNumber: 'NV-001',
    lastOrderStatus: 'SHIPPED',
    lastOrderAt: new Date('2026-01-03T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
  assert.equal(receivedWhere?.staffCredential, null);
  assert.deepEqual(receivedWhere?.roles, { none: {} });
  const phoneClauses = (receivedWhere?.OR as Array<{ phone?: { contains?: string } }>).filter(
    (clause) => clause.phone,
  );
  assert.ok(phoneClauses.some((clause) => clause.phone?.contains === '+98912'));
});

test('customer lookup remains unavailable to staff without a read role', async () => {
  const database = { prisma: { user: { count: async () => 0, findMany: async () => [] } } } as unknown as DatabaseService;
  await assert.rejects(
    new CustomerAdminService(database).listForStaff(
      staff([]),
      Object.assign(new AdminCustomerListQueryDto(), {}),
    ),
    { message: 'دسترسی لازم برای این عملیات را ندارید.' },
  );
});
