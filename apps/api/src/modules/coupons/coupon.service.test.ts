import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ConflictException } from '@nestjs/common';

import { CouponService } from './coupon.service';

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
  updatedAt: Date;
}

interface FakeRedemption {
  id: string;
  couponId: string;
  userId: string | null;
  orderId: string;
  status: 'RESERVED' | 'COMMITTED' | 'RELEASED';
  reservedUntil: Date | null;
  committedAt: Date | null;
  releasedAt: Date | null;
}

function createFixture(overrides: Partial<FakeCoupon> = {}) {
  const now = new Date('2026-09-09T10:00:00.000Z');
  const coupon: FakeCoupon = {
    id: 'coupon-1',
    code: 'SAVE10',
    type: 'PERCENTAGE',
    amount: 10,
    minimumOrderToman: 200_000,
    activeFrom: new Date('2026-09-01T00:00:00.000Z'),
    activeUntil: new Date('2026-10-01T00:00:00.000Z'),
    maxRedemptions: 2,
    perUserLimit: 1,
    isActive: true,
    updatedAt: now,
    ...overrides,
  };
  const redemptions: FakeRedemption[] = [];
  let nextId = 1;
  const database = {
    coupon: {
      findUnique: async ({ where }: { where: { code: string } }) =>
        coupon.code === where.code ? { ...coupon } : null,
      update: async ({ data }: { data: { updatedAt: Date } }) => {
        coupon.updatedAt = data.updatedAt;
        return { ...coupon };
      },
    },
    promotionRedemption: {
      count: async ({ where }: { where: Record<string, unknown> }) => {
        const active = redemptions.filter((redemption) => {
          if (redemption.couponId !== where.couponId) return false;
          if (where.userId && redemption.userId !== where.userId) return false;
          return (
            redemption.status === 'COMMITTED' ||
            (redemption.status === 'RESERVED' &&
              redemption.reservedUntil !== null &&
              redemption.reservedUntil > now)
          );
        });
        return active.length;
      },
      updateMany: async ({ data }: { data: Record<string, unknown> }) => {
        let count = 0;
        for (const redemption of redemptions) {
          if (redemption.couponId !== coupon.id) continue;
          if (data.status === 'RELEASED' && redemption.status === 'RESERVED') {
            redemption.status = 'RELEASED';
            redemption.reservedUntil = null;
            redemption.releasedAt = data.releasedAt as Date;
            count += 1;
          }
          if (data.status === 'COMMITTED' && redemption.status === 'RESERVED') {
            redemption.status = 'COMMITTED';
            redemption.reservedUntil = null;
            redemption.committedAt = data.committedAt as Date;
            count += 1;
          }
        }
        return { count };
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const redemption: FakeRedemption = {
          id: `redemption-${nextId++}`,
          couponId: String(data.couponId),
          userId: String(data.userId),
          orderId: String(data.orderId),
          status: data.status as FakeRedemption['status'],
          reservedUntil: data.reservedUntil as Date,
          committedAt: null,
          releasedAt: null,
        };
        redemptions.push(redemption);
        return { id: redemption.id };
      },
    },
  };
  return { now, coupon, redemptions, database, service: new CouponService({ prisma: database } as never) };
}

test('previews a normalized percentage coupon and applies the minimum order rule', async () => {
  const fixture = createFixture();
  const result = await fixture.service.preview({
    code: ' save10 ',
    userId: 'user-1',
    subtotalToman: 1_000_000,
    now: fixture.now,
  });

  assert.equal(result.code, 'SAVE10');
  assert.equal(result.discountToman, 100_000);
  assert.equal(result.minimumOrderToman, 200_000);
});

test('rejects a coupon when the per-user limit is already committed', async () => {
  const fixture = createFixture();
  fixture.redemptions.push({
    id: 'redemption-existing',
    couponId: fixture.coupon.id,
    userId: 'user-1',
    orderId: 'order-existing',
    status: 'COMMITTED',
    reservedUntil: null,
    committedAt: fixture.now,
    releasedAt: null,
  });

  await assert.rejects(
    fixture.service.preview({
      code: 'SAVE10',
      userId: 'user-1',
      subtotalToman: 1_000_000,
      now: fixture.now,
    }),
    (error: unknown) => error instanceof ConflictException,
  );
});

test('reserves a coupon and makes commit/release transitions idempotent', async () => {
  const fixture = createFixture();
  const reservation = await fixture.service.reserveForOrder(
    {
      code: 'SAVE10',
      userId: 'user-1',
      orderId: 'order-1',
      subtotalToman: 1_000_000,
      reservedUntil: new Date(fixture.now.getTime() + 900_000),
      now: fixture.now,
    },
    fixture.database as never,
  );

  assert.equal(reservation.redemptionId, 'redemption-1');
  assert.equal(fixture.redemptions[0]?.status, 'RESERVED');

  await fixture.service.commitForOrder('order-1', fixture.database as never, fixture.now);
  await fixture.service.commitForOrder('order-1', fixture.database as never, fixture.now);
  assert.equal(fixture.redemptions[0]?.status, 'COMMITTED');

  const released = createFixture();
  await released.service.reserveForOrder(
    {
      code: 'SAVE10',
      userId: 'user-1',
      orderId: 'order-2',
      subtotalToman: 1_000_000,
      reservedUntil: new Date(released.now.getTime() + 900_000),
      now: released.now,
    },
    released.database as never,
  );
  await released.service.releaseForOrder('order-2', released.database as never, released.now);
  await released.service.releaseForOrder('order-2', released.database as never, released.now);
  assert.equal(released.redemptions[0]?.status, 'RELEASED');
});
