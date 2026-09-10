import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ForbiddenException, NotFoundException } from '@nestjs/common';

import type { AuthenticatedStaff } from '../auth/session.service';
import { AdminOrderListQueryDto } from './dto/admin-order-list.query';
import { OrdersService } from './orders.service';

interface FakeAdminOrder {
  id: string;
  orderNumber: string;
  status: 'CONFIRMED' | 'SHIPPED';
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
  } | null;
  shipment: {
    status: 'PENDING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';
    trackingReference: string | null;
  } | null;
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
  events: Array<{
    fromStatus: 'CONFIRMED' | 'SHIPPED' | null;
    toStatus: 'CONFIRMED' | 'SHIPPED' | null;
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
    id: 'staff-1',
    email: 'support@nova.test',
    status: 'ACTIVE',
    roles,
  };
}

function createOrder(overrides: Partial<FakeAdminOrder> = {}): FakeAdminOrder {
  return {
    id: 'order-1',
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
    user: {
      id: 'user-1',
      phone: '09121234567',
      email: 'reza@example.com',
      status: 'ACTIVE',
    },
    shipment: {
      status: 'SHIPPED',
      trackingReference: 'TRK-1',
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
      {
        fromStatus: 'CONFIRMED',
        toStatus: 'SHIPPED',
        createdAt: new Date('2026-09-08T08:00:00.000Z'),
      },
    ],
    refunds: [],
    returnRequest: null,
    ...overrides,
  };
}

function createService(initial: FakeAdminOrder[]) {
  const orders = [...initial];
  type FakeOrderWhere = {
    status?: string;
    paymentStatus?: string;
    OR?: Array<{ orderNumber?: { contains?: string } }>;
  };
  const matches = (order: FakeAdminOrder, where: FakeOrderWhere): boolean => {
    if (where.status && order.status !== where.status) return false;
    if (where.paymentStatus && order.paymentStatus !== where.paymentStatus) return false;
    const search = where.OR?.[0]?.orderNumber?.contains;
    if (
      search &&
      ![order.orderNumber, order.user?.phone, order.user?.email]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(search.toLowerCase()))
    ) {
      return false;
    }
    return true;
  };
  const prisma = {
    order: {
      count: async ({ where }: { where: FakeOrderWhere }) =>
        orders.filter((order) => matches(order, where)).length,
      findMany: async ({
        where,
        skip,
        take,
      }: {
        where: FakeOrderWhere;
        skip: number;
        take: number;
      }) =>
        orders
          .filter((order) => matches(order, where))
          .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
          .slice(skip, skip + take),
      findUnique: async ({ where }: { where: { orderNumber: string } }) =>
        orders.find((order) => order.orderNumber === where.orderNumber) ?? null,
    },
  };
  return new OrdersService({ prisma } as never);
}

test('support staff can search orders and receive customer/shipment summaries', async () => {
  const service = createService([
    createOrder(),
    createOrder({
      id: 'order-2',
      orderNumber: 'NV-ABC-002',
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
      user: {
        id: 'user-2',
        phone: '09120000000',
        email: 'sara@example.com',
        status: 'ACTIVE',
      },
    }),
  ]);
  const query = Object.assign(new AdminOrderListQueryDto(), {
    q: 'reza@example.com',
    status: 'SHIPPED',
    paymentStatus: 'PAID',
  });

  const result = await service.listForStaff(createStaff(['support']), query);

  assert.equal(result.total, 1);
  assert.equal(result.items[0]?.customer?.email, 'reza@example.com');
  assert.equal(result.items[0]?.shipmentStatus, 'SHIPPED');
  assert.equal(result.items[0]?.trackingReference, 'TRK-1');
});

test('staff detail returns the order snapshots and customer identity without internal reasons', async () => {
  const service = createService([createOrder()]);

  const result = await service.getForStaff(createStaff(['operations']), 'NV-ABC-001');

  assert.equal(result.customer?.phone, '09121234567');
  assert.equal(result.items[0]?.productName, 'مانتوی لینن کمربندی آوا');
  assert.equal(result.payment?.status, 'SUCCEEDED');
  assert.equal(result.shipment?.trackingReference, 'TRK-1');
  assert.equal('reason' in (result.events[0] ?? {}), false);
});

test('staff order reads enforce roles and hide missing orders', async () => {
  const service = createService([createOrder()]);

  await assert.rejects(
    service.listForStaff(createStaff([]), Object.assign(new AdminOrderListQueryDto(), {})),
    (error) => {
      assert.ok(error instanceof ForbiddenException);
      return true;
    },
  );

  await assert.rejects(service.getForStaff(createStaff(['admin']), 'NV-MISSING-001'), (error) => {
    assert.ok(error instanceof NotFoundException);
    return true;
  });
});
