import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ConflictException, ForbiddenException } from '@nestjs/common';

import type { AuthenticatedStaff } from '../auth/session.service';
import type { InventoryService } from '../inventory/inventory.service';
import type { ProcessRefundInput, ProcessRefundView } from '../payments/payment.service';
import { AdminReturnReviewDto } from './dto/admin-return-review.dto';
import { CustomerOrderCancelDto } from './dto/customer-order-cancel.dto';
import { CustomerReturnRequestDto } from './dto/customer-return-request.dto';
import { OrdersService } from './orders.service';

type FakeOrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';
type FakePaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
type FakeAttemptStatus = 'PENDING' | 'REDIRECTED' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
type FakeShipmentStatus = 'PENDING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';
type FakeReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED' | 'CANCELLED';
type FakeReturnReason =
  | 'DAMAGED'
  | 'INCORRECT_ITEM'
  | 'DEFECTIVE'
  | 'SIZE_PREFERENCE'
  | 'COLOR_PREFERENCE'
  | 'CHANGE_OF_MIND';

interface FakeOrder {
  id: string;
  userId: string;
  orderNumber: string;
  status: FakeOrderStatus;
  paymentStatus: FakePaymentStatus;
  subtotalToman: number;
  discountToman: number;
  shippingToman: number;
  taxToman: number;
  totalToman: number;
  moneyUnit: 'TOMAN';
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    productId: string;
    variantId: string;
    productNameSnapshot: string;
    skuSnapshot: string;
    variantSnapshot: { size: string };
    quantity: number;
    unitPriceToman: number;
    compareAtPriceToman: number | null;
    discountToman: number;
    taxToman: number;
    totalToman: number;
  }>;
  addressSnapshot: {
    recipientName: string;
    phone: string;
    province: string;
    city: string;
    addressLine: string;
    postalCode: string;
  };
  paymentAttempts: Array<{
    id: string;
    provider: string;
    providerTransactionId: string | null;
    status: FakeAttemptStatus;
    amountToman: number;
    redirectUrl: string | null;
    createdAt: Date;
    paidAt: Date | null;
  }>;
  shipment: {
    id: string;
    provider: string;
    method: string;
    trackingReference: string | null;
    status: FakeShipmentStatus;
    shippedAt: Date | null;
    deliveredAt: Date | null;
  } | null;
  events: Array<{
    fromStatus: FakeOrderStatus | null;
    toStatus: FakeOrderStatus | null;
    createdAt: Date;
  }>;
  refunds: Array<{
    id: string;
    amountToman: number;
    status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
    reason: string | null;
    createdAt: Date;
    completedAt: Date | null;
  }>;
  returnRequest: {
    id: string;
    reason: FakeReturnReason;
    note: string | null;
    status: FakeReturnStatus;
    requestedAt: Date;
    reviewedAt: Date | null;
    receivedAt: Date | null;
    items: Array<{ orderItemId: string; quantity: number }>;
  } | null;
}

function createStaff(roles: AuthenticatedStaff['roles']): AuthenticatedStaff {
  return {
    id: 'staff-1',
    email: 'operations@nova.test',
    status: 'ACTIVE',
    roles,
  };
}

function createOrder(overrides: Partial<FakeOrder> = {}): FakeOrder {
  const createdAt = new Date('2026-09-01T08:00:00.000Z');
  return {
    id: 'order-actions-1',
    userId: 'user-1',
    orderNumber: 'NV-ACTIONS-001',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    subtotalToman: 2_000_000,
    discountToman: 0,
    shippingToman: 89_000,
    taxToman: 0,
    totalToman: 2_089_000,
    moneyUnit: 'TOMAN',
    createdAt,
    updatedAt: new Date('2026-09-08T08:00:00.000Z'),
    items: [
      {
        id: 'order-item-1',
        productId: 'product-1',
        variantId: 'variant-1',
        productNameSnapshot: 'کت پیشمی کلاسیک',
        skuSnapshot: 'NOVA-COAT-001-M',
        variantSnapshot: { size: 'M' },
        quantity: 1,
        unitPriceToman: 2_000_000,
        compareAtPriceToman: 2_400_000,
        discountToman: 0,
        taxToman: 0,
        totalToman: 2_000_000,
      },
    ],
    addressSnapshot: {
      recipientName: 'رضا صادقی',
      phone: '09121234567',
      province: 'تهران',
      city: 'تهران',
      addressLine: 'خیابان ولیعصر',
      postalCode: '1234567890',
    },
    paymentAttempts: [
      {
        id: 'attempt-actions-1',
        provider: 'fake-gateway',
        providerTransactionId: 'transaction-1',
        status: 'SUCCEEDED',
        amountToman: 2_089_000,
        redirectUrl: null,
        createdAt: new Date('2026-09-01T08:01:00.000Z'),
        paidAt: new Date('2026-09-01T08:02:00.000Z'),
      },
    ],
    shipment: {
      id: 'shipment-actions-1',
      provider: 'local',
      method: 'STANDARD',
      trackingReference: null,
      status: 'PENDING',
      shippedAt: null,
      deliveredAt: null,
    },
    events: [],
    refunds: [],
    returnRequest: null,
    ...overrides,
  };
}

function createFixture(order = createOrder()) {
  const orders = [order];
  const refundCalls: ProcessRefundInput[] = [];
  let releaseCalls = 0;

  const matches = (
    candidate: FakeOrder,
    where: {
      id?: string;
      userId?: string;
      orderNumber?: string;
      status?: FakeOrderStatus;
      paymentStatus?: FakePaymentStatus;
      updatedAt?: Date;
    },
  ): boolean => {
    if (where.id !== undefined && candidate.id !== where.id) return false;
    if (where.userId !== undefined && candidate.userId !== where.userId) return false;
    if (where.orderNumber !== undefined && candidate.orderNumber !== where.orderNumber) return false;
    if (where.status !== undefined && candidate.status !== where.status) return false;
    if (where.paymentStatus !== undefined && candidate.paymentStatus !== where.paymentStatus) {
      return false;
    }
    if (where.updatedAt && candidate.updatedAt.getTime() !== where.updatedAt.getTime()) return false;
    return true;
  };

  const transaction = {
    order: {
      findFirst: async ({ where }: { where: { userId: string; orderNumber: string } }) =>
        orders.find((candidate) => matches(candidate, where)) ?? null,
      findUnique: async ({ where }: { where: { orderNumber: string; id?: string } }) =>
        orders.find((candidate) => matches(candidate, where)) ?? null,
      updateMany: async ({
        where,
        data,
      }: {
        where: {
          id: string;
          userId?: string;
          orderNumber?: string;
          status?: FakeOrderStatus;
          paymentStatus?: FakePaymentStatus;
          updatedAt?: Date;
        };
        data: {
          status?: FakeOrderStatus;
          paymentStatus?: FakePaymentStatus;
          updatedAt?: Date;
        };
      }) => {
        const candidate = orders.find((item) => matches(item, where));
        if (!candidate) return { count: 0 };
        if (data.status) candidate.status = data.status;
        if (data.paymentStatus) candidate.paymentStatus = data.paymentStatus;
        candidate.updatedAt = data.updatedAt ?? new Date(candidate.updatedAt.getTime() + 1);
        return { count: 1 };
      },
    },
    paymentAttempt: {
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; status: { in: FakeAttemptStatus[] } };
        data: { status: FakeAttemptStatus };
      }) => {
        const attempt = order.paymentAttempts.find((item) => item.id === where.id);
        if (!attempt || !where.status.in.includes(attempt.status)) return { count: 0 };
        attempt.status = data.status;
        return { count: 1 };
      },
    },
    orderEvent: {
      create: async ({
        data,
      }: {
        data: {
          orderId: string;
          actorType: 'CUSTOMER' | 'STAFF';
          actorId: string;
          fromStatus: FakeOrderStatus;
          toStatus: FakeOrderStatus;
          reason: string;
        };
      }) => {
        order.events.push({
          fromStatus: data.fromStatus,
          toStatus: data.toStatus,
          createdAt: new Date(),
        });
        return data;
      },
    },
    returnRequest: {
      findUnique: async ({
        where,
      }: {
        where: { orderId?: string; id?: string };
      }) => {
        if (where.id && order.returnRequest?.id !== where.id) return null;
        if (where.orderId && order.returnRequest === null) return null;
        return order.returnRequest;
      },
      create: async ({
        data,
      }: {
        data: {
          orderId: string;
          userId: string;
          reason: FakeReturnReason;
          note: string | null;
          items: { create: Array<{ orderItemId: string; quantity: number }> };
        };
      }) => {
        order.returnRequest = {
          id: 'return-actions-1',
          reason: data.reason,
          note: data.note,
          status: 'REQUESTED',
          requestedAt: new Date(),
          reviewedAt: null,
          receivedAt: null,
          items: data.items.create,
        };
        return { id: order.returnRequest.id };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: {
          status: FakeReturnStatus;
          reviewedAt?: Date;
          reviewedByStaffId?: string;
          receivedAt?: Date;
        };
      }) => {
        if (!order.returnRequest || order.returnRequest.id !== where.id) {
          throw new Error('missing return request');
        }
        order.returnRequest.status = data.status;
        if (data.reviewedAt) order.returnRequest.reviewedAt = data.reviewedAt;
        if (data.receivedAt) order.returnRequest.receivedAt = data.receivedAt;
        return order.returnRequest;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; status: FakeReturnStatus };
        data: {
          status: FakeReturnStatus;
          reviewedAt?: Date;
          reviewedByStaffId?: string;
        };
      }) => {
        if (!order.returnRequest || order.returnRequest.id !== where.id) return { count: 0 };
        if (order.returnRequest.status !== where.status) return { count: 0 };
        order.returnRequest.status = data.status;
        if (data.reviewedAt) order.returnRequest.reviewedAt = data.reviewedAt;
        return { count: 1 };
      },
    },
    refund: {
      findUnique: async ({ where }: { where: { idempotencyKey: string } }) => {
        const exists = refundCalls.some((call) => call.idempotencyKey === where.idempotencyKey);
        return exists ? { id: 'refund-1' } : null;
      },
    },
    shipment: {
      updateMany: async ({
        where,
        data,
      }: {
        where: { orderId: string; status: FakeShipmentStatus };
        data: { status: FakeShipmentStatus };
      }) => {
        if (!order.shipment || order.id !== where.orderId || order.shipment.status !== where.status) {
          return { count: 0 };
        }
        order.shipment.status = data.status;
        return { count: 1 };
      },
    },
  };

  const prisma = {
    ...transaction,
    $transaction: async <T>(callback: (database: never) => Promise<T>) =>
      callback(transaction as never),
  };
  const inventory = {
    releaseForOrder: async () => {
      releaseCalls += 1;
    },
  };
  const payments = {
    processRefund: async (input: ProcessRefundInput): Promise<ProcessRefundView> => {
      const existingCall = refundCalls.find((call) => call.idempotencyKey === input.idempotencyKey);
      if (existingCall) {
        return {
          refundId: 'refund-1',
          refundStatus: 'SUCCEEDED',
          providerRefundId: 'provider-refund-1',
          paymentStatus: order.paymentStatus,
        };
      }
      refundCalls.push(input);
      const full = input.amountToman === order.totalToman;
      order.paymentStatus = full ? 'REFUNDED' : 'PAID';
      order.refunds.push({
        id: `refund-${refundCalls.length}`,
        amountToman: input.amountToman,
        status: 'SUCCEEDED',
        reason: input.reason,
        createdAt: new Date(),
        completedAt: new Date(),
      });
      return {
        refundId: `refund-${refundCalls.length}`,
        refundStatus: 'SUCCEEDED',
        providerRefundId: 'provider-refund-1',
        paymentStatus: order.paymentStatus,
      };
    },
  };

  return {
    order,
    refundCalls,
    get releaseCalls() {
      return releaseCalls;
    },
    service: new OrdersService(
      { prisma } as never,
      undefined,
      inventory as unknown as InventoryService,
      payments as never,
    ),
  };
}

function cancelInput(): CustomerOrderCancelDto {
  return Object.assign(new CustomerOrderCancelDto(), { reason: 'تغییر نظر مشتری' });
}

test('customer can cancel an unpaid order and reservations are released', async () => {
  const fixture = createFixture(
    createOrder({
      status: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      paymentAttempts: [
        {
          ...createOrder().paymentAttempts[0]!,
          status: 'REDIRECTED',
        },
      ],
    }),
  );

  const result = await fixture.service.cancelForCustomer(
    'user-1',
    fixture.order.orderNumber,
    cancelInput(),
  );

  assert.equal(result.status, 'CANCELLED');
  assert.equal(result.paymentStatus, 'FAILED');
  assert.equal(fixture.order.paymentAttempts[0]?.status, 'CANCELLED');
  assert.equal(fixture.releaseCalls, 1);
  assert.equal(fixture.refundCalls.length, 0);
});

test('customer cancellation creates a full refund workflow for a confirmed order', async () => {
  const fixture = createFixture();

  const result = await fixture.service.cancelForCustomer(
    'user-1',
    fixture.order.orderNumber,
    cancelInput(),
  );

  assert.equal(result.status, 'CANCELLED');
  assert.equal(result.paymentStatus, 'REFUNDED');
  assert.equal(result.refunds[0]?.status, 'SUCCEEDED');
  assert.equal(fixture.refundCalls[0]?.idempotencyKey, `customer-cancel:${fixture.order.id}`);

  const repeated = await fixture.service.cancelForCustomer(
    'user-1',
    fixture.order.orderNumber,
    cancelInput(),
  );
  assert.equal(repeated.paymentStatus, 'REFUNDED');
  assert.equal(fixture.refundCalls.length, 1);
});

test('customer can request a full-line return within seven days of delivery', async () => {
  const fixture = createFixture(
    createOrder({
      status: 'DELIVERED',
      shipment: {
        ...createOrder().shipment!,
        status: 'DELIVERED',
        deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    }),
  );
  const input = Object.assign(new CustomerReturnRequestDto(), {
    reason: 'SIZE_PREFERENCE',
    note: 'سایز مناسب نبود',
    unusedConfirmed: true,
    unwashedConfirmed: true,
    tagsAttachedConfirmed: true,
    items: [{ orderItemId: 'order-item-1', quantity: 1 }],
  });

  const result = await fixture.service.requestReturnForCustomer(
    'user-1',
    fixture.order.orderNumber,
    input,
  );

  assert.equal(result.returnRequest?.status, 'REQUESTED');
  assert.deepEqual(result.returnRequest?.items, [{ orderItemId: 'order-item-1', quantity: 1 }]);
});

test('support can approve and receive a return, then the full order becomes returned', async () => {
  const fixture = createFixture(
    createOrder({
      status: 'DELIVERED',
      shipment: {
        ...createOrder().shipment!,
        status: 'DELIVERED',
        deliveredAt: new Date('2026-09-07T08:00:00.000Z'),
      },
      returnRequest: {
        id: 'return-actions-1',
        reason: 'DAMAGED',
        note: null,
        status: 'REQUESTED',
        requestedAt: new Date('2026-09-07T10:00:00.000Z'),
        reviewedAt: null,
        receivedAt: null,
        items: [{ orderItemId: 'order-item-1', quantity: 1 }],
      },
    }),
  );
  const approve = Object.assign(new AdminReturnReviewDto(), {
    status: 'APPROVED',
    reason: 'درخواست با سیاست مرجوعی مطابقت دارد',
  });
  await fixture.service.reviewReturnForStaff(
    createStaff(['support']),
    fixture.order.orderNumber,
    approve,
  );

  const receive = Object.assign(new AdminReturnReviewDto(), {
    status: 'RECEIVED',
    reason: 'کالا دریافت و بررسی شد',
  });
  const result = await fixture.service.reviewReturnForStaff(
    createStaff(['support']),
    fixture.order.orderNumber,
    receive,
  );

  assert.equal(result.status, 'RETURNED');
  assert.equal(result.paymentStatus, 'PAID');
  assert.equal(result.shipment?.status, 'RETURNED');
  assert.equal(result.returnRequest?.status, 'REFUNDED');
  assert.equal(fixture.refundCalls[0]?.returnRequestId, 'return-actions-1');
});

test('operations staff cannot review returns and delivered orders cannot be returned after the window', async () => {
  const fixture = createFixture(
    createOrder({
      status: 'DELIVERED',
      shipment: {
        ...createOrder().shipment!,
        status: 'DELIVERED',
        deliveredAt: new Date('2026-08-01T08:00:00.000Z'),
      },
    }),
  );
  const input = Object.assign(new CustomerReturnRequestDto(), {
    reason: 'CHANGE_OF_MIND',
    unusedConfirmed: true,
    unwashedConfirmed: true,
    tagsAttachedConfirmed: true,
    items: [{ orderItemId: 'order-item-1', quantity: 1 }],
  });

  await assert.rejects(
    fixture.service.requestReturnForCustomer('user-1', fixture.order.orderNumber, input),
    (error) => error instanceof ConflictException,
  );

  fixture.order.shipment!.deliveredAt = new Date('2026-09-07T08:00:00.000Z');
  fixture.order.returnRequest = {
    id: 'return-actions-1',
    reason: 'DAMAGED',
    note: null,
    status: 'REQUESTED',
    requestedAt: new Date(),
    reviewedAt: null,
    receivedAt: null,
    items: [{ orderItemId: 'order-item-1', quantity: 1 }],
  };
  const review = Object.assign(new AdminReturnReviewDto(), {
    status: 'APPROVED',
    reason: 'بررسی',
  });
  await assert.rejects(
    fixture.service.reviewReturnForStaff(
      createStaff(['operations']),
      fixture.order.orderNumber,
      review,
    ),
    (error) => error instanceof ForbiddenException,
  );
});
