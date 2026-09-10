import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BadRequestException, ForbiddenException } from '@nestjs/common';

import type { AuthenticatedStaff } from '../auth/session.service';
import { AdminPaymentListQueryDto } from './dto/admin-payment-list.query';
import { PaymentAdminService } from './payment-admin.service';

interface PaymentRow {
  id: string;
  orderId: string;
  provider: string;
  providerTransactionId: string | null;
  status: 'PENDING' | 'REDIRECTED' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  amountToman: number;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
  order: {
    orderNumber: string;
    status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  };
  refunds: Array<{
    id: string;
    amountToman: number;
    status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
    providerRefundId: string | null;
    reason: string | null;
    createdAt: Date;
    completedAt: Date | null;
  }>;
}

function staff(roles: AuthenticatedStaff['roles']): AuthenticatedStaff {
  return { id: 'staff-1', email: 'admin@nova.test', status: 'ACTIVE', roles };
}

function createService(rows: PaymentRow[]) {
  const matches = (row: PaymentRow, where: Record<string, unknown>): boolean => {
    if (where.status !== undefined && row.status !== where.status) return false;
    if (where.provider !== undefined && row.provider !== where.provider) return false;
    if (where.order && (where.order as { orderNumber: string }).orderNumber !== row.order.orderNumber) return false;
    return true;
  };
  const prisma = {
    paymentAttempt: {
      count: async ({ where }: { where: Record<string, unknown> }) => rows.filter((row) => matches(row, where)).length,
      findMany: async ({ where, skip, take }: { where: Record<string, unknown>; skip: number; take: number }) =>
        rows.filter((row) => matches(row, where)).sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()).slice(skip, skip + take),
      findUnique: async ({ where }: { where: { id: string } }) => rows.find((row) => row.id === where.id) ?? null,
    },
  };
  return new PaymentAdminService({ prisma } as never);
}

function row(overrides: Partial<PaymentRow> = {}): PaymentRow {
  return {
    id: 'attempt-1',
    orderId: 'order-1',
    provider: 'fake-gateway',
    providerTransactionId: 'transaction-1',
    status: 'FAILED',
    amountToman: 2_000_000,
    createdAt: new Date('2026-09-08T10:00:00Z'),
    updatedAt: new Date('2026-09-08T10:00:00Z'),
    paidAt: null,
    order: { orderNumber: 'NV-42', status: 'CANCELLED', paymentStatus: 'FAILED' },
    refunds: [],
    ...overrides,
  };
}

test('admin payment reads filter by status and omit redirect/raw payload fields', async () => {
  const service = createService([
    row(),
    row({
      id: 'attempt-2',
      status: 'SUCCEEDED',
      createdAt: new Date('2026-09-08T11:00:00Z'),
      updatedAt: new Date('2026-09-08T11:00:00Z'),
      order: { orderNumber: 'NV-43', status: 'CONFIRMED', paymentStatus: 'PAID' },
    }),
  ]);
  const query = Object.assign(new AdminPaymentListQueryDto(), { status: 'SUCCEEDED' });

  const result = await service.list(staff(['admin']), query);
  assert.equal(result.total, 1);
  assert.equal(result.items[0]?.id, 'attempt-2');
  assert.equal('redirectUrl' in (result.items[0] ?? {}), false);
});

test('payment reads are admin-only and validate order filters', async () => {
  const service = createService([]);
  await assert.rejects(
    service.list(staff(['support']), new AdminPaymentListQueryDto()),
    (error) => error instanceof ForbiddenException,
  );

  const query = Object.assign(new AdminPaymentListQueryDto(), { orderNumber: 'invalid order' });
  await assert.rejects(
    service.list(staff(['admin']), query),
    (error) => error instanceof BadRequestException,
  );
});
