import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ConflictException, ForbiddenException } from '@nestjs/common';

import type { AuthenticatedStaff } from '../auth/session.service';
import { AdminOrderStatusDto } from './dto/admin-order-status.dto';
import { AdminShipmentUpdateDto } from './dto/admin-shipment.dto';
import { OrdersService } from './orders.service';

type FakeOrderStatus = 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED';
type FakeShipmentStatus = 'PENDING' | 'PACKED' | 'SHIPPED' | 'DELIVERED';

interface FakeFulfillmentOrder {
  id: string;
  orderNumber: string;
  status: FakeOrderStatus;
  paymentStatus: 'PAID' | 'PENDING';
  subtotalToman: number;
  discountToman: number;
  shippingToman: number;
  taxToman: number;
  totalToman: number;
  moneyUnit: 'TOMAN';
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    phone: string;
    email: string | null;
    status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  };
  shipment: {
    id: string;
    provider: string;
    method: string;
    trackingReference: string | null;
    status: FakeShipmentStatus;
    shippingToman: number;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    updatedAt: Date;
  };
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
    status: 'SUCCEEDED';
    amountToman: number;
    redirectUrl: null;
    createdAt: Date;
    paidAt: Date;
  }>;
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
  returnRequest: null;
}

function createStaff(roles: AuthenticatedStaff['roles']): AuthenticatedStaff {
  return {
    id: 'staff-operations-1',
    email: 'operations@nova.test',
    status: 'ACTIVE',
    roles,
  };
}

function createOrder(overrides: Partial<FakeFulfillmentOrder> = {}): FakeFulfillmentOrder {
  const timestamp = new Date('2026-09-08T08:00:00.000Z');
  return {
    id: 'order-fulfillment-1',
    orderNumber: 'NV-FULFILL-001',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    subtotalToman: 2_000_000,
    discountToman: 0,
    shippingToman: 89_000,
    taxToman: 0,
    totalToman: 2_089_000,
    moneyUnit: 'TOMAN',
    createdAt: new Date('2026-09-07T08:00:00.000Z'),
    updatedAt: timestamp,
    user: {
      id: 'user-1',
      phone: '09121234567',
      email: 'reza@example.com',
      status: 'ACTIVE',
    },
    shipment: {
      id: 'shipment-1',
      provider: 'local',
      method: 'STANDARD',
      trackingReference: null,
      status: 'PENDING',
      shippingToman: 89_000,
      shippedAt: null,
      deliveredAt: null,
      updatedAt: timestamp,
    },
    items: [
      {
        id: 'item-1',
        productId: 'product-1',
        variantId: 'variant-1',
        productNameSnapshot: 'مانتوی لینن کمربندی آوا',
        skuSnapshot: 'NOVA-LINEN-001-M',
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
        status: 'SUCCEEDED',
        amountToman: 2_089_000,
        redirectUrl: null,
        createdAt: new Date('2026-09-07T08:01:00.000Z'),
        paidAt: new Date('2026-09-07T08:02:00.000Z'),
      },
    ],
    events: [
      {
        fromStatus: null,
        toStatus: 'CONFIRMED',
        createdAt: new Date('2026-09-07T08:00:00.000Z'),
      },
    ],
    refunds: [],
    returnRequest: null,
    ...overrides,
  };
}

function createService(initial: FakeFulfillmentOrder[]) {
  const orders = [...initial];
  const events = new Map<string, FakeFulfillmentOrder['events']>();
  for (const order of orders) events.set(order.id, order.events);

  const prisma = {
    order: {
      findUnique: async ({ where }: { where: { orderNumber?: string; id?: string } }) =>
        orders.find(
          (order) =>
            (where.orderNumber !== undefined && order.orderNumber === where.orderNumber) ||
            (where.id !== undefined && order.id === where.id),
        ) ?? null,
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; status?: FakeOrderStatus; updatedAt?: Date };
        data: { status?: FakeOrderStatus; updatedAt?: Date };
      }) => {
        const order = orders.find((candidate) => candidate.id === where.id);
        if (!order || (where.status && order.status !== where.status)) return { count: 0 };
        if (where.updatedAt && order.updatedAt.getTime() !== where.updatedAt.getTime()) {
          return { count: 0 };
        }
        if (data.status) order.status = data.status;
        order.updatedAt = data.updatedAt ?? new Date(order.updatedAt.getTime() + 1);
        return { count: 1 };
      },
    },
    shipment: {
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { orderId: string };
        create: {
          orderId: string;
          provider: string;
          method: string;
          trackingReference: string | null;
          status: FakeShipmentStatus;
          shippingToman: number;
          shippedAt?: Date;
          deliveredAt?: Date;
        };
        update: {
          provider: string;
          method: string;
          trackingReference: string | null;
          status: FakeShipmentStatus;
          shippedAt?: Date;
          deliveredAt?: Date;
        };
      }) => {
        const order = orders.find((candidate) => candidate.id === where.orderId);
        if (!order) throw new Error('missing order');
        const next = order.shipment ?? {
          id: `shipment-${order.id}`,
          provider: create.provider,
          method: create.method,
          trackingReference: create.trackingReference,
          status: create.status,
          shippingToman: create.shippingToman,
          shippedAt: create.shippedAt ?? null,
          deliveredAt: create.deliveredAt ?? null,
          updatedAt: new Date(),
        };
        Object.assign(next, update, {
          ...(create.shippedAt ? { shippedAt: create.shippedAt } : {}),
          ...(create.deliveredAt ? { deliveredAt: create.deliveredAt } : {}),
          updatedAt: new Date(next.updatedAt.getTime() + 1),
        });
        order.shipment = next;
        return next;
      },
    },
    orderEvent: {
      create: async ({
        data,
      }: {
        data: {
          orderId: string;
          fromStatus: FakeOrderStatus;
          toStatus: FakeOrderStatus;
          reason: string;
          actorType: 'STAFF';
          actorId: string;
        };
      }) => {
        const order = orders.find((candidate) => candidate.id === data.orderId);
        if (!order) throw new Error('missing order');
        order.events.push({
          fromStatus: data.fromStatus,
          toStatus: data.toStatus,
          createdAt: new Date(),
        });
        return order.events.at(-1);
      },
    },
    $transaction: async <T>(callback: (transaction: never) => Promise<T>) =>
      callback(prisma as never),
  };

  return { service: new OrdersService({ prisma } as never), orders, events };
}

test('operations staff can advance fulfillment with a reason and event', async () => {
  const { service, orders } = createService([createOrder()]);
  const input = Object.assign(new AdminOrderStatusDto(), {
    status: 'PREPARING',
    reason: 'سفارش برای آماده‌سازی تحویل انبار شد',
  });

  const result = await service.updateFulfillmentStatus(
    createStaff(['operations']),
    'NV-FULFILL-001',
    input,
  );

  assert.equal(result.status, 'PREPARING');
  assert.equal(orders[0]?.status, 'PREPARING');
  assert.equal(orders[0]?.events.at(-1)?.toStatus, 'PREPARING');
});

test('support staff cannot mutate fulfillment and stale versions are rejected', async () => {
  const order = createOrder();
  const { service } = createService([order]);
  const statusInput = Object.assign(new AdminOrderStatusDto(), {
    status: 'PREPARING',
    reason: 'آماده‌سازی',
  });

  await assert.rejects(
    service.updateFulfillmentStatus(createStaff(['support']), order.orderNumber, statusInput),
    (error) => error instanceof ForbiddenException,
  );

  const staleInput = Object.assign(new AdminOrderStatusDto(), {
    status: 'PREPARING',
    reason: 'آماده‌سازی',
    expectedUpdatedAt: '2020-01-01T00:00:00.000Z',
  });
  await assert.rejects(
    service.updateFulfillmentStatus(createStaff(['operations']), order.orderNumber, staleInput),
    (error) => error instanceof ConflictException,
  );
});

test('shipment transition synchronizes order status and timestamps', async () => {
  const order = createOrder({
    status: 'PREPARING',
    shipment: {
      ...createOrder().shipment,
      status: 'PACKED',
    },
  });
  const { service, orders } = createService([order]);
  const input = Object.assign(new AdminShipmentUpdateDto(), {
    provider: 'post',
    method: 'EXPRESS',
    status: 'SHIPPED',
    trackingReference: 'TRK-2026-001',
    reason: 'مرسوله به شرکت حمل تحویل شد',
  });

  const result = await service.updateShipment(
    createStaff(['operations']),
    order.orderNumber,
    input,
  );

  assert.equal(result.status, 'SHIPPED');
  assert.equal(result.shipment?.status, 'SHIPPED');
  assert.equal(result.shipment?.trackingReference, 'TRK-2026-001');
  assert.ok(result.shipment?.shippedAt);
  assert.equal(orders[0]?.events.at(-1)?.toStatus, 'SHIPPED');
});
