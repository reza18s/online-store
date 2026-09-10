import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ConflictException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { CouponService } from './coupon.service';
import { AdminCouponListQueryDto } from './dto/admin-coupon.query';

interface FakeCoupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  amount: number;
  minimumOrderToman: number;
  activeFrom: Date;
  activeUntil: Date;
  maxRedemptions: number | null;
  perUserLimit: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function createStaff(roles: string[]): AuthenticatedStaff {
  return {
    id: 'staff-1',
    email: 'staff@nova.test',
    status: 'ACTIVE',
    roles,
  };
}

function createFixture() {
  const now = new Date('2026-09-09T10:00:00.000Z');
  const state: { coupon: FakeCoupon | null; audits: Array<Record<string, unknown>> } = {
    coupon: {
      id: 'coupon-1',
      code: 'SAVE10',
      type: 'PERCENTAGE',
      amount: 10,
      minimumOrderToman: 200_000,
      activeFrom: new Date('2026-09-01T00:00:00.000Z'),
      activeUntil: new Date('2026-10-01T00:00:00.000Z'),
      maxRedemptions: 100,
      perUserLimit: 1,
      isActive: true,
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
      updatedAt: now,
    },
    audits: [],
  };

  const database = {
    coupon: {
      count: async () => (state.coupon ? 1 : 0),
      findMany: async () => (state.coupon ? [{ ...state.coupon }] : []),
      findUnique: async ({ where }: { where: { id?: string } }) =>
        state.coupon && (!where.id || where.id === state.coupon.id) ? { ...state.coupon } : null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const created: FakeCoupon = {
          id: 'coupon-created',
          code: String(data.code),
          type: data.type as FakeCoupon['type'],
          amount: Number(data.amount),
          minimumOrderToman: Number(data.minimumOrderToman),
          activeFrom: data.activeFrom as Date,
          activeUntil: data.activeUntil as Date,
          maxRedemptions: (data.maxRedemptions as number | null) ?? null,
          perUserLimit: (data.perUserLimit as number | null) ?? null,
          isActive: Boolean(data.isActive),
          createdAt: now,
          updatedAt: now,
        };
        state.coupon = created;
        return { ...created };
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; updatedAt?: Date };
        data: Record<string, unknown>;
      }) => {
        if (!state.coupon || state.coupon.id !== where.id) return { count: 0 };
        if (where.updatedAt && state.coupon.updatedAt.getTime() !== where.updatedAt.getTime()) {
          return { count: 0 };
        }
        Object.assign(state.coupon, data, { updatedAt: new Date(now.getTime() + 1) });
        return { count: 1 };
      },
    },
    auditEvent: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        state.audits.push(data);
        return data;
      },
    },
  };
  const prisma = {
    ...database,
    $transaction: async <T>(callback: (transaction: typeof database) => Promise<T>) =>
      callback(database),
  };
  const audit = new AuditService({ prisma } as never);
  return {
    now,
    state,
    database: prisma,
    service: new CouponService({ prisma } as never, audit),
  };
}

test('staff can list coupon status and admins can create audited coupons', async () => {
  const fixture = createFixture();
  const page = await fixture.service.listForStaff(createStaff(['support']), new AdminCouponListQueryDto());
  assert.equal(page.total, 1);
  assert.equal(page.items[0]?.status, 'ACTIVE');

  const created = await fixture.service.createForStaff(createStaff(['admin']), {
    code: 'spring-20',
    type: 'FIXED',
    amount: 20_000,
    minimumOrderToman: 100_000,
    activeFrom: '2026-09-09T00:00:00.000Z',
    activeUntil: '2026-10-01T00:00:00.000Z',
    maxRedemptions: 10,
    perUserLimit: 1,
    isActive: true,
  });

  assert.equal(created.code, 'SPRING-20');
  assert.equal(fixture.state.audits.at(-1)?.action, 'coupon.created');
});

test('admin coupon updates use optimistic concurrency and can disable a code', async () => {
  const fixture = createFixture();
  const expectedUpdatedAt = fixture.now.toISOString();
  const updated = await fixture.service.updateForStaff(createStaff(['admin']), 'coupon-1', {
    isActive: false,
    expectedUpdatedAt,
  });

  assert.equal(updated.status, 'DISABLED');
  assert.equal(fixture.state.audits.at(-1)?.action, 'coupon.updated');
  await assert.rejects(
    fixture.service.updateForStaff(createStaff(['admin']), 'coupon-1', {
      isActive: true,
      expectedUpdatedAt,
    }),
    (error: unknown) => error instanceof ConflictException,
  );
});
