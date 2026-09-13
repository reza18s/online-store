import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';

import type { AuthenticatedStaff } from '../auth/session.service';
import {
  DEFAULT_DASHBOARD_PERIOD_DAYS,
  DashboardService,
  MAX_DASHBOARD_PERIOD_DAYS,
} from './dashboard.service';

function staff(roles: AuthenticatedStaff['roles']): AuthenticatedStaff {
  return { id: 'staff-1', email: 'admin@nova.test', status: 'ACTIVE', roles };
}

interface DashboardCall {
  model: string;
  operation: string;
  args: unknown;
}

interface DashboardOptions {
  paidGrossToman?: number | null;
  successfulRefundToman?: number | null;
  databaseError?: Error;
}

function createService(options: DashboardOptions = {}) {
  const calls: DashboardCall[] = [];
  const record = (model: string, operation: string, args: unknown): void => {
    calls.push({ model, operation, args });
  };
  const failIfConfigured = (): void => {
    if (options.databaseError) throw options.databaseError;
  };
  const prisma = {
    product: {
      count: async (args: unknown) => {
        record('product', 'count', args);
        failIfConfigured();
        return 4;
      },
    },
    user: {
      count: async (args: unknown) => {
        record('user', 'count', args);
        failIfConfigured();
        return 3;
      },
    },
    order: {
      count: async (args: unknown) => {
        record('order', 'count', args);
        failIfConfigured();
        return 5;
      },
      aggregate: async (args: unknown) => {
        record('order', 'aggregate', args);
        failIfConfigured();
        return { _sum: { totalToman: options.paidGrossToman ?? null } };
      },
      groupBy: async (args: unknown) => {
        record('order', 'groupBy', args);
        failIfConfigured();
        return [
          { status: 'CONFIRMED', _count: { _all: 2 } },
          { status: 'SHIPPED', _count: { _all: 1 } },
        ];
      },
    },
    refund: {
      aggregate: async (args: unknown) => {
        record('refund', 'aggregate', args);
        failIfConfigured();
        return { _sum: { amountToman: options.successfulRefundToman ?? null } };
      },
    },
  };

  return {
    calls,
    service: new DashboardService({ prisma } as never),
  };
}

test('uses exact period filters and returns bounded aggregates with zero-filled statuses', async () => {
  const now = new Date('2026-09-13T12:00:00.000Z');
  const { calls, service } = createService({
    paidGrossToman: 7_500_000,
    successfulRefundToman: 250_000,
  });

  const result = await service.getSummary(staff(['admin']), { periodDays: '30' }, now);
  const periodStart = new Date('2026-08-14T12:00:00.000Z');

  assert.deepEqual(calls, [
    {
      model: 'product',
      operation: 'count',
      args: { where: { status: 'PUBLISHED' } },
    },
    {
      model: 'user',
      operation: 'count',
      args: {
        where: {
          createdAt: { gte: periodStart },
          status: { not: 'DELETED' },
          staffCredential: { is: null },
          roles: { none: {} },
        },
      },
    },
    {
      model: 'order',
      operation: 'count',
      args: { where: { createdAt: { gte: periodStart } } },
    },
    {
      model: 'order',
      operation: 'aggregate',
      args: {
        where: {
          createdAt: { gte: periodStart },
          paymentStatus: 'PAID',
        },
        _sum: { totalToman: true },
      },
    },
    {
      model: 'refund',
      operation: 'aggregate',
      args: {
        where: {
          createdAt: { gte: periodStart },
          status: 'SUCCEEDED',
        },
        _sum: { amountToman: true },
      },
    },
    {
      model: 'order',
      operation: 'groupBy',
      args: {
        by: ['status'],
        where: { createdAt: { gte: periodStart } },
        _count: { _all: true },
      },
    },
  ]);
  assert.deepEqual(result, {
    publishedProductCount: 4,
    newCustomerCount: 3,
    newOrderCount: 5,
    paidGrossToman: 7_500_000,
    successfulRefundToman: 250_000,
    orderStatusCounts: {
      PENDING_PAYMENT: 0,
      CONFIRMED: 2,
      PREPARING: 0,
      SHIPPED: 1,
      DELIVERED: 0,
      CANCELLED: 0,
      RETURNED: 0,
    },
  });
});

test('defaults omitted periodDays to 30 and rejects malformed or out-of-range values', async () => {
  const now = new Date('2026-09-13T12:00:00.000Z');
  const defaultCall = createService();
  await defaultCall.service.getSummary(staff(['admin']), {}, now);
  assert.deepEqual(defaultCall.calls[1]?.args, {
    where: {
      createdAt: {
        gte: new Date('2026-08-14T12:00:00.000Z'),
      },
      status: { not: 'DELETED' },
      staffCredential: { is: null },
      roles: { none: {} },
    },
  });

  assert.equal(DEFAULT_DASHBOARD_PERIOD_DAYS, 30);
  assert.equal(MAX_DASHBOARD_PERIOD_DAYS, 365);

  for (const value of ['', ' ', '0', '-1', '1.5', '1e2', '366', Number.MAX_SAFE_INTEGER + 1]) {
    const { calls, service } = createService();
    await assert.rejects(
      service.getSummary(staff(['admin']), { periodDays: value }, now),
      (error: unknown) => error instanceof BadRequestException,
    );
    assert.equal(calls.length, 0);
  }
});

test('requires the admin role before reading any dashboard aggregate', async () => {
  const { calls, service } = createService();

  await assert.rejects(
    service.getSummary(staff(['support']), { periodDays: '30' }),
    (error: unknown) => error instanceof ForbiddenException,
  );
  assert.equal(calls.length, 0);
});

test('returns only aggregate data and sanitizes unexpected database failures', async () => {
  const { service } = createService({ paidGrossToman: null, successfulRefundToman: null });
  const result = await service.getSummary(
    staff(['admin']),
    { periodDays: '30' },
    new Date('2026-09-13T12:00:00.000Z'),
  );

  assert.deepEqual(Object.keys(result).sort(), [
    'newCustomerCount',
    'newOrderCount',
    'orderStatusCounts',
    'paidGrossToman',
    'publishedProductCount',
    'successfulRefundToman',
  ]);
  assert.equal(JSON.stringify(result).includes('staff-1'), false);
  assert.equal(JSON.stringify(result).includes('nova.test'), false);
  assert.equal(JSON.stringify(result).includes('https://'), false);
  assert.equal(result.paidGrossToman, 0);
  assert.equal(result.successfulRefundToman, 0);

  const secret = 'database-secret-connection-detail';
  const failure = createService({ databaseError: new Error(secret) });
  await assert.rejects(
    failure.service.getSummary(staff(['admin']), { periodDays: '30' }),
    (error: unknown) => {
      return (
        error instanceof InternalServerErrorException &&
        error.message === 'خطای داخلی سرویس.' &&
        !error.message.includes(secret)
      );
    },
  );
});

test('uses only read-shaped Prisma operations', async () => {
  const { calls, service } = createService();

  await service.getSummary(
    staff(['admin']),
    { periodDays: '30' },
    new Date('2026-09-13T12:00:00.000Z'),
  );

  assert.deepEqual(
    calls.map(({ model, operation }) => `${model}.${operation}`),
    [
      'product.count',
      'user.count',
      'order.count',
      'order.aggregate',
      'refund.aggregate',
      'order.groupBy',
    ],
  );
});
