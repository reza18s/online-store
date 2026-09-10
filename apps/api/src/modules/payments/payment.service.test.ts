import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ConflictException } from '@nestjs/common';

import type { AuditService } from '../audit/audit.service';
import type { PaymentCallbackResult, PaymentGateway } from '../checkout/payment.gateway';
import type { InventoryService } from '../inventory/inventory.service';
import type { CouponService } from '../coupons/coupon.service';
import type { NotificationService } from '../notifications/notification.service';
import { PaymentService } from './payment.service';

interface State {
  order: {
    id: string;
    orderNumber: string;
    status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
    addressSnapshot: { phone: string } | null;
    items: Array<{ variantId: string | null; quantity: number }>;
  };
  attempt: {
    id: string;
    orderId: string;
    provider: string;
    providerTransactionId: string | null;
    status: 'PENDING' | 'REDIRECTED' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';
    amountToman: number;
  };
  webhooks: Map<
    string,
    { id: string; payloadHash: string; processedAt: Date | null; error: string | null }
  >;
  refunds: Map<
    string,
    {
      id: string;
      status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
      providerRefundId: string | null;
    }
  >;
  events: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  couponCommits: string[];
  couponReleases: string[];
  audits: Array<Record<string, unknown>>;
}

function createState(overrides: Partial<State['order']> = {}): State {
  return {
    order: {
      id: 'order-1',
      orderNumber: 'NV-ABC-001',
      status: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      addressSnapshot: { phone: '+989121234567' },
      items: [{ variantId: 'variant-1', quantity: 2 }],
      ...overrides,
    },
    attempt: {
      id: 'attempt-1',
      orderId: 'order-1',
      provider: 'fake-gateway',
      providerTransactionId: 'transaction-1',
      status: 'PENDING',
      amountToman: 289_000,
    },
    webhooks: new Map(),
    refunds: new Map(),
    events: [],
    notifications: [],
    couponCommits: [],
    couponReleases: [],
    audits: [],
  };
}

function createFixture(
  options: {
    state?: State;
    settlement?: 'CONSUMED' | 'REACQUIRE_REQUIRED';
    reserveError?: Error;
    refundError?: Error;
    coupons?: CouponService;
  } = {},
) {
  const state = options.state ?? createState();
  let settlement = options.settlement ?? 'CONSUMED';
  const gateway: PaymentGateway = {
    name: 'fake-gateway',
    startPayment: async () => ({ redirectUrl: 'https://payments.example.test/redirect' }),
    verifyCallback: async ({ payload }) => payload as PaymentCallbackResult,
    refundPayment: async () => {
      if (options.refundError) throw options.refundError;
      return { providerRefundId: 'refund-1' };
    },
  };
  const inventory = {
    consumeForOrder: async () => settlement,
    releaseForOrder: async () => undefined,
    reserve: async () => {
      if (options.reserveError) throw options.reserveError;
      settlement = 'CONSUMED';
      return { reservations: [], expiresAt: new Date() };
    },
  };
  const transactionTarget = {
    webhookEvent: {
      findUnique: async ({
        where,
      }: {
        where: { provider_providerEventId: { provider: string; providerEventId: string } };
      }) =>
        state.webhooks.get(
          `${where.provider_providerEventId.provider}:${where.provider_providerEventId.providerEventId}`,
        ) ?? null,
      create: async ({
        data,
      }: {
        data: { provider: string; providerEventId: string; payloadHash: string };
      }) => {
        const key = `${data.provider}:${data.providerEventId}`;
        if (state.webhooks.has(key)) throw new Error('duplicate webhook');
        const record = {
          id: `webhook-${state.webhooks.size + 1}`,
          ...data,
          processedAt: null,
          error: null,
        };
        state.webhooks.set(key, record);
        return { id: record.id };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { processedAt?: Date; error?: string | null };
      }) => {
        const record = [...state.webhooks.values()].find((candidate) => candidate.id === where.id);
        if (!record) throw new Error('missing webhook');
        if (data.processedAt !== undefined) record.processedAt = data.processedAt;
        if ('error' in data) record.error = data.error ?? null;
        return record;
      },
    },
    paymentAttempt: {
      findFirst: async () => ({
        ...state.attempt,
        order: { ...state.order, items: state.order.items.map((item) => ({ ...item })) },
      }),
      updateMany: async ({ data }: { data: Partial<State['attempt']> }) => {
        state.attempt = { ...state.attempt, ...data };
        return { count: 1 };
      },
      update: async ({ data }: { data: Partial<State['attempt']> }) => {
        state.attempt = { ...state.attempt, ...data };
        return state.attempt;
      },
    },
    order: {
      updateMany: async ({ data }: { data: Partial<State['order']> }) => {
        state.order = { ...state.order, ...data };
        return { count: 1 };
      },
      update: async ({ data }: { data: Partial<State['order']> }) => {
        state.order = { ...state.order, ...data };
        return state.order;
      },
    },
    orderEvent: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        state.events.push(data);
        return data;
      },
    },
    refund: {
      findUnique: async ({ where }: { where: { idempotencyKey: string } }) =>
        [...state.refunds.values()].find((refund) => refund.id === where.idempotencyKey) ?? null,
      create: async ({ data }: { data: { idempotencyKey: string } }) => {
        const refund = {
          id: data.idempotencyKey,
          status: 'PENDING' as const,
          providerRefundId: null,
        };
        state.refunds.set(refund.id, refund);
        return refund;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<State['refunds']>;
      }) => {
        const refund = state.refunds.get(where.id);
        if (!refund) throw new Error('missing refund');
        Object.assign(refund, data);
        return refund;
      },
    },
  };
  const prisma = {
    ...transactionTarget,
    $transaction: async <T>(callback: (transaction: typeof transactionTarget) => Promise<T>) =>
      callback(transactionTarget),
  };
  const audit = {
    record: async (input: Record<string, unknown>) => {
      state.audits.push(input);
    },
  };
  const notifications = {
    enqueuePaymentEvent: async (input: Record<string, unknown>) => {
      state.notifications.push(input);
    },
  } as unknown as NotificationService;
  const coupons =
    options.coupons ??
    ({
      commitForOrder: async (orderId: string) => {
        state.couponCommits.push(orderId);
      },
      releaseForOrder: async (orderId: string) => {
        state.couponReleases.push(orderId);
      },
    } as unknown as CouponService);
  return {
    state,
    service: new PaymentService(
      { prisma } as never,
      inventory as unknown as InventoryService,
      audit as unknown as AuditService,
      gateway,
      notifications,
      coupons,
    ),
  };
}

function callback(overrides: Partial<PaymentCallbackResult> = {}): PaymentCallbackResult {
  return {
    providerEventId: 'event-1',
    orderNumber: 'NV-ABC-001',
    status: 'PAID',
    amountToman: 289_000,
    providerTransactionId: 'transaction-1',
    ...overrides,
  };
}

test('confirms a paid callback, consumes reservations, and makes duplicates harmless', async () => {
  const fixture = createFixture();
  const first = await fixture.service.handleCallback({
    provider: 'fake-gateway',
    payload: callback(),
    signature: 'verified-by-test-gateway',
  });
  const second = await fixture.service.handleCallback({
    provider: 'fake-gateway',
    payload: callback(),
  });

  assert.equal(first.outcome, 'PAID');
  assert.equal(fixture.state.order.status, 'CONFIRMED');
  assert.equal(fixture.state.order.paymentStatus, 'PAID');
  assert.equal(fixture.state.attempt.status, 'SUCCEEDED');
  assert.equal(fixture.state.events[0]?.toStatus, 'CONFIRMED');
  assert.equal(fixture.state.notifications.length, 1);
  assert.equal(fixture.state.notifications[0]?.kind, 'PAYMENT_SUCCEEDED');
  assert.deepEqual(fixture.state.couponCommits, ['order-1']);
  assert.equal(second.outcome, 'DUPLICATE');
});

test('cancels a pending order and releases stock after a failed callback', async () => {
  const fixture = createFixture({ state: createState(), settlement: 'CONSUMED' });
  const result = await fixture.service.handleCallback({
    provider: 'fake-gateway',
    payload: callback({ status: 'FAILED' }),
  });

  assert.equal(result.outcome, 'FAILED');
  assert.equal(fixture.state.order.status, 'CANCELLED');
  assert.equal(fixture.state.order.paymentStatus, 'FAILED');
  assert.equal(fixture.state.attempt.status, 'FAILED');
  assert.equal(fixture.state.notifications.length, 1);
  assert.equal(fixture.state.notifications[0]?.kind, 'PAYMENT_FAILED');
  assert.deepEqual(fixture.state.couponReleases, ['order-1']);
});

test('reacquires stock for a late paid callback and refunds when stock is unavailable', async () => {
  const fixture = createFixture({
    settlement: 'REACQUIRE_REQUIRED',
    reserveError: new ConflictException('موجودی کافی نیست.'),
  });
  const result = await fixture.service.handleCallback({
    provider: 'fake-gateway',
    payload: callback({ providerEventId: 'event-late' }),
  });

  assert.equal(result.outcome, 'REFUNDED');
  assert.equal(result.refundStatus, 'SUCCEEDED');
  assert.equal(fixture.state.order.status, 'CANCELLED');
  assert.equal(fixture.state.order.paymentStatus, 'REFUNDED');
  assert.equal(fixture.state.refunds.get('late-payment:attempt-1')?.status, 'SUCCEEDED');
  assert.equal(fixture.state.events[0]?.toStatus, 'CANCELLED');
  assert.deepEqual(fixture.state.couponReleases, ['order-1']);
});

test('keeps a late payment observable when the provider refund fails', async () => {
  const fixture = createFixture({
    settlement: 'REACQUIRE_REQUIRED',
    reserveError: new ConflictException('موجودی کافی نیست.'),
    refundError: new Error('provider unavailable'),
  });

  const result = await fixture.service.handleCallback({
    provider: 'fake-gateway',
    payload: callback({ providerEventId: 'event-refund-failure' }),
  });

  const webhook = fixture.state.webhooks.get('fake-gateway:event-refund-failure');
  assert.equal(result.outcome, 'REFUND_FAILED');
  assert.equal(result.paymentStatus, 'PAID');
  assert.equal(fixture.state.refunds.get('late-payment:attempt-1')?.status, 'FAILED');
  assert.equal(webhook?.error, 'refund-failed');
});

test('rejects a reused provider event with a different payload hash', async () => {
  const fixture = createFixture();
  await fixture.service.handleCallback({ provider: 'fake-gateway', payload: callback() });

  await assert.rejects(
    fixture.service.handleCallback({
      provider: 'fake-gateway',
      payload: callback({ amountToman: 1 }),
    }),
    (error: unknown) => error instanceof ConflictException,
  );
});
