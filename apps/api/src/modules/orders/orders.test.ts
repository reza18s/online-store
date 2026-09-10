import assert from 'node:assert/strict';
import { test } from 'node:test';

import { OrdersService } from './orders.service';
import { CustomerOrderListQueryDto } from './dto/order-list.query';

interface FakeOrder {
  id: string;
  userId: string | null;
  orderNumber: string;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'SHIPPED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  subtotalToman: number;
  discountToman: number;
  shippingToman: number;
  taxToman: number;
  totalToman: number;
  moneyUnit: string;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    productId: string | null;
    variantId: string | null;
    productNameSnapshot: string;
    skuSnapshot: string;
    variantSnapshot: unknown;
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
  } | null;
  paymentAttempts: Array<{
    status: 'PENDING' | 'REDIRECTED' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
    amountToman: number;
    redirectUrl: string | null;
    createdAt: Date;
    paidAt: Date | null;
  }>;
  shipment: {
    provider: string;
    method: string;
    trackingReference: string | null;
    status: 'PENDING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';
    shippedAt: Date | null;
    deliveredAt: Date | null;
  } | null;
  events: Array<{
    fromStatus: 'PENDING_PAYMENT' | 'CONFIRMED' | 'SHIPPED' | null;
    toStatus: 'PENDING_PAYMENT' | 'CONFIRMED' | 'SHIPPED' | null;
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

function createOrder(overrides: Partial<FakeOrder> = {}): FakeOrder {
  return {
    id: 'order-1',
    userId: 'user-1',
    orderNumber: 'NV-ABC-001',
    status: 'SHIPPED',
    paymentStatus: 'PAID',
    subtotalToman: 2_000_000,
    discountToman: 0,
    shippingToman: 89_000,
    taxToman: 0,
    totalToman: 2_089_000,
    moneyUnit: 'TOMAN',
    createdAt: new Date('2026-09-07T08:00:00.000Z'),
    updatedAt: new Date('2026-09-08T08:00:00.000Z'),
    items: [
      {
        id: 'item-1',
        productId: 'product-1',
        variantId: 'variant-1',
        productNameSnapshot: 'مانتوی لینن کمربندی آوا',
        skuSnapshot: 'NOVA-LINEN-001-M',
        variantSnapshot: { size: 'M', color: 'کرم' },
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
    shipment: {
      provider: 'local',
      method: 'EXPRESS',
      trackingReference: 'TRK-1',
      status: 'SHIPPED',
      shippedAt: new Date('2026-09-08T09:00:00.000Z'),
      deliveredAt: null,
    },
    events: [
      {
        fromStatus: null,
        toStatus: 'PENDING_PAYMENT',
        createdAt: new Date('2026-09-07T08:00:00.000Z'),
      },
      {
        fromStatus: 'CONFIRMED',
        toStatus: 'SHIPPED',
        createdAt: new Date('2026-09-08T09:00:00.000Z'),
      },
    ],
    refunds: [],
    returnRequest: null,
    ...overrides,
  };
}

function createService(initial: FakeOrder[]) {
  const orders = [...initial];
  const prisma = {
    order: {
      count: async ({ where }: { where: { userId: string; status?: string } }) =>
        orders.filter(
          (order) =>
            order.userId === where.userId &&
            (where.status === undefined || order.status === where.status),
        ).length,
      findMany: async ({
        where,
        skip,
        take,
      }: {
        where: { userId: string; status?: string };
        skip: number;
        take: number;
      }) =>
        orders
          .filter(
            (order) =>
              order.userId === where.userId &&
              (where.status === undefined || order.status === where.status),
          )
          .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
          .slice(skip, skip + take),
      findFirst: async ({ where }: { where: { userId: string; orderNumber: string } }) =>
        orders.find(
          (order) => order.userId === where.userId && order.orderNumber === where.orderNumber,
        ) ?? null,
    },
  };
  return { service: new OrdersService({ prisma } as never), orders };
}

test('lists only the customer orders and applies status pagination', async () => {
  const { service } = createService([
    createOrder(),
    createOrder({
      id: 'order-2',
      orderNumber: 'NV-ABC-002',
      userId: 'user-2',
      status: 'CONFIRMED',
    }),
    createOrder({
      id: 'order-3',
      orderNumber: 'NV-ABC-003',
      status: 'CONFIRMED',
      createdAt: new Date('2026-09-06T08:00:00.000Z'),
    }),
  ]);
  const query = Object.assign(new CustomerOrderListQueryDto(), {
    page: 1,
    limit: 1,
    status: 'SHIPPED',
  });

  const result = await service.listForCustomer('user-1', query);

  assert.equal(result.total, 1);
  assert.equal(result.items[0]?.orderNumber, 'NV-ABC-001');
  assert.equal(result.items[0]?.currency, 'TOMAN');
});

test('returns immutable order snapshots, payment, shipment, and timeline for the owner', async () => {
  const { service } = createService([createOrder()]);

  const result = await service.getForCustomer('user-1', 'NV-ABC-001');

  assert.equal(result.items[0]?.productName, 'مانتوی لینن کمربندی آوا');
  assert.deepEqual(result.items[0]?.variantSnapshot, { size: 'M', color: 'کرم' });
  assert.equal(result.address?.postalCode, '1234567890');
  assert.equal(result.payment?.status, 'SUCCEEDED');
  assert.equal(result.shipment?.trackingReference, 'TRK-1');
  assert.equal(result.events.length, 2);
});

test('does not reveal an order belonging to another customer', async () => {
  const { service } = createService([createOrder({ userId: 'user-2' })]);

  await assert.rejects(service.getForCustomer('user-1', 'NV-ABC-001'), /سفارش پیدا نشد/);
});
