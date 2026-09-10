import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { AuditService } from '../audit/audit.service';
import type { PaymentGateway } from '../checkout/payment.gateway';
import type { InventoryService } from '../inventory/inventory.service';
import { PaymentService, type ProcessRefundInput } from './payment.service';

interface RefundRecord {
  id: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  providerRefundId: string | null;
}

function createFixture() {
  const order = {
    id: 'order-refund-1',
    orderNumber: 'NV-REFUND-001',
    totalToman: 2_089_000,
    paymentStatus: 'PAID' as 'PAID' | 'REFUNDED',
  };
  const refunds = new Map<string, RefundRecord>();
  let gatewayCalls = 0;
  let failGateway = false;
  const transaction = {
    order: {
      updateMany: async ({ data }: { data: { paymentStatus: 'REFUNDED' } }) => {
        order.paymentStatus = data.paymentStatus;
        return { count: 1 };
      },
    },
    refund: {
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: {
          status: 'SUCCEEDED';
          providerRefundId?: string;
          completedAt: Date;
        };
      }) => {
        const refund = refunds.get(where.id);
        if (!refund) throw new Error('missing refund');
        refund.status = data.status;
        refund.providerRefundId = data.providerRefundId ?? refund.providerRefundId;
        return refund;
      },
    },
  };
  const prisma = {
    order: {
      findUnique: async () => ({ ...order }),
    },
    refund: {
      findUnique: async ({ where }: { where: { idempotencyKey: string } }) => {
        const refund = refunds.get(where.idempotencyKey);
        return refund ? { ...refund } : null;
      },
      create: async ({
        data,
      }: {
        data: { idempotencyKey: string };
      }) => {
        const refund = {
          id: data.idempotencyKey,
          status: 'PENDING' as const,
          providerRefundId: null,
        };
        refunds.set(data.idempotencyKey, refund);
        return { ...refund };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { status: 'FAILED' };
      }) => {
        const refund = [...refunds.values()].find((candidate) => candidate.id === where.id);
        if (!refund) throw new Error('missing refund');
        refund.status = data.status;
        return { ...refund };
      },
    },
    $transaction: async <T>(callback: (database: never) => Promise<T>) =>
      callback(transaction as never),
  };
  const gateway: PaymentGateway = {
    name: 'fake-gateway',
    startPayment: async () => ({ redirectUrl: 'https://payments.example.test/redirect' }),
    verifyCallback: async () => {
      throw new Error('not used');
    },
    refundPayment: async () => {
      gatewayCalls += 1;
      if (failGateway) throw new Error('provider unavailable');
      return { providerRefundId: 'provider-refund-1' };
    },
  };
  const audit = { record: async () => undefined };
  const service = new PaymentService(
    { prisma } as never,
    {} as InventoryService,
    audit as unknown as AuditService,
    gateway,
  );
  return {
    order,
    refunds,
    service,
    setGatewayFailure(value: boolean) {
      failGateway = value;
    },
    get gatewayCalls() {
      return gatewayCalls;
    },
  };
}

function input(overrides: Partial<ProcessRefundInput> = {}): ProcessRefundInput {
  return {
    orderId: 'order-refund-1',
    orderNumber: 'NV-REFUND-001',
    provider: 'fake-gateway',
    amountToman: 2_089_000,
    idempotencyKey: 'cancel:order-refund-1',
    reason: 'لغو سفارش توسط مشتری',
    ...overrides,
  };
}

test('full refunds are idempotent and move the payment to refunded', async () => {
  const fixture = createFixture();
  const first = await fixture.service.processRefund(input());
  const second = await fixture.service.processRefund(input());

  assert.equal(first.refundStatus, 'SUCCEEDED');
  assert.equal(first.paymentStatus, 'REFUNDED');
  assert.equal(second.refundStatus, 'SUCCEEDED');
  assert.equal(fixture.order.paymentStatus, 'REFUNDED');
  assert.equal(fixture.gatewayCalls, 1);
});

test('failed refunds remain observable and can be retried with the same key', async () => {
  const fixture = createFixture();
  fixture.setGatewayFailure(true);
  const failed = await fixture.service.processRefund(input());

  assert.equal(failed.refundStatus, 'FAILED');
  assert.equal(fixture.order.paymentStatus, 'PAID');
  assert.equal(fixture.refunds.get('cancel:order-refund-1')?.status, 'FAILED');

  fixture.setGatewayFailure(false);
  const retried = await fixture.service.processRefund(input());
  assert.equal(retried.refundStatus, 'SUCCEEDED');
  assert.equal(fixture.order.paymentStatus, 'REFUNDED');
  assert.equal(fixture.gatewayCalls, 2);
});

test('partial refunds preserve paid payment status for later reconciliation', async () => {
  const fixture = createFixture();
  const result = await fixture.service.processRefund(
    input({ amountToman: 2_000_000, idempotencyKey: 'return:return-1' }),
  );

  assert.equal(result.refundStatus, 'SUCCEEDED');
  assert.equal(result.paymentStatus, 'PAID');
  assert.equal(fixture.order.paymentStatus, 'PAID');
});
