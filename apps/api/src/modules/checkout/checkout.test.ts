import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ConflictException } from '@nestjs/common';
import type { OrderStatus, PaymentAttemptStatus, PaymentStatus } from '@nova/db';

import type { CustomerAddress } from '../addresses/address.service';
import type { AuthoritativeCart } from '../cart/cart.service';
import type { InventoryReservationBatch } from '../inventory/inventory.service';
import type { CouponService } from '../coupons/coupon.service';
import { CheckoutService, type CheckoutQuoteInput } from './checkout.service';
import type { PaymentGateway, PaymentStartInput, PaymentStartResult } from './payment.gateway';
import { FixedShippingProvider } from './shipping.provider';

interface FakePaymentAttempt {
  id: string;
  orderId: string;
  status: PaymentAttemptStatus;
  redirectUrl: string | null;
  amountToman: number;
}

interface FakeOrder {
  id: string;
  userId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalToman: number;
  discountToman: number;
  shippingToman: number;
  taxToman: number;
  totalToman: number;
  idempotencyKey: string;
  paymentAttempts: FakePaymentAttempt[];
}

interface FakeStore {
  orders: Map<string, FakeOrder>;
  paymentAttempts: Map<string, FakePaymentAttempt>;
  orderItems: Array<Record<string, unknown>>;
  addressSnapshots: Array<Record<string, unknown>>;
  shipments: Array<Record<string, unknown>>;
  orderEvents: Array<Record<string, unknown>>;
  nextOrderId: number;
  nextPaymentAttemptId: number;
}

interface FixtureOptions {
  cart?: AuthoritativeCart;
  paymentGateway?: PaymentGateway & { starts?: number };
  coupons?: CouponService;
}

function address(): CustomerAddress {
  const timestamp = new Date('2026-09-08T08:00:00.000Z');
  return {
    id: 'address-1',
    label: 'خانه',
    recipientName: 'رضا صادقی',
    phone: '+989121234567',
    province: 'تهران',
    city: 'تهران',
    addressLine: 'خیابان ولیعصر، پلاک ۱',
    postalCode: '1234567890',
    isDefault: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function cart(overrides: Partial<AuthoritativeCart> = {}): AuthoritativeCart {
  return {
    id: 'cart-1',
    kind: 'CUSTOMER',
    items: [
      {
        id: 'cart-item-1',
        variantId: 'variant-1',
        quantity: 2,
        variant: {
          id: 'variant-1',
          sku: 'NOVA-001',
          title: 'کت پیشمی کلاسیک',
          size: 'M',
          color: 'قهوه‌ای',
          colorHex: '#6b4f3a',
          priceToman: 100_000,
          compareAtPriceToman: 120_000,
          isActive: true,
          inventory: { onHand: 10, reserved: 0 },
          optionValues: [
            {
              optionValue: {
                key: 'medium',
                label: 'متوسط',
                option: { key: 'size', name: 'سایز' },
              },
            },
          ],
          product: {
            id: 'product-1',
            slug: 'classic-coat',
            name: 'کت پیشمی کلاسیک',
            status: 'PUBLISHED',
            archivedAt: null,
            basePriceToman: 110_000,
            compareAtPriceToman: 130_000,
            media: [{ url: '/images/coat.webp', altText: 'کت پیشمی کلاسیک' }],
          },
        },
      },
    ],
    ...overrides,
  };
}

function successfulGateway(): PaymentGateway & { starts: number } {
  const gateway = {
    name: 'fake-gateway',
    starts: 0,
    startPayment: async (input: PaymentStartInput): Promise<PaymentStartResult> => {
      void input;
      gateway.starts += 1;
      return {
        redirectUrl: 'https://payments.example.test/checkout/transaction-1',
        providerTransactionId: 'transaction-1',
      };
    },
    verifyCallback: async () => {
      throw new Error('not used by checkout tests');
    },
    refundPayment: async () => {
      throw new Error('not used by checkout tests');
    },
  };
  return gateway;
}

function createDatabase() {
  const state: FakeStore = {
    orders: new Map(),
    paymentAttempts: new Map(),
    orderItems: [],
    addressSnapshots: [],
    shipments: [],
    orderEvents: [],
    nextOrderId: 1,
    nextPaymentAttemptId: 1,
  };

  const source = (order: FakeOrder) => ({
    id: order.id,
    userId: order.userId,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotalToman: order.subtotalToman,
    discountToman: order.discountToman,
    shippingToman: order.shippingToman,
    taxToman: order.taxToman,
    totalToman: order.totalToman,
    paymentAttempts: order.paymentAttempts
      .slice()
      .sort((left, right) => right.id.localeCompare(left.id))
      .slice(0, 1)
      .map((attempt) => ({
        status: attempt.status,
        redirectUrl: attempt.redirectUrl,
      })),
  });

  const client = {
    order: {
      findUnique: async ({ where }: { where: { id?: string; idempotencyKey?: string } }) => {
        const order = where.id
          ? [...state.orders.values()].find((candidate) => candidate.id === where.id)
          : [...state.orders.values()].find(
              (candidate) => candidate.idempotencyKey === where.idempotencyKey,
            );
        return order ? source(order) : null;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const order: FakeOrder = {
          id: `order-${state.nextOrderId++}`,
          userId: String(data.userId),
          orderNumber: String(data.orderNumber),
          status: data.status as OrderStatus,
          paymentStatus: data.paymentStatus as PaymentStatus,
          subtotalToman: Number(data.subtotalToman),
          discountToman: Number(data.discountToman),
          shippingToman: Number(data.shippingToman),
          taxToman: Number(data.taxToman),
          totalToman: Number(data.totalToman),
          idempotencyKey: String(data.idempotencyKey),
          paymentAttempts: [],
        };
        state.orders.set(order.id, order);
        return { id: order.id, orderNumber: order.orderNumber };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { status: OrderStatus; paymentStatus: PaymentStatus };
      }) => {
        const order = state.orders.get(where.id);
        if (!order) throw new Error('missing fake order');
        order.status = data.status;
        order.paymentStatus = data.paymentStatus;
        return source(order);
      },
    },
    orderItem: {
      createMany: async ({ data }: { data: Array<Record<string, unknown>> }) => {
        state.orderItems.push(...data);
        return { count: data.length };
      },
    },
    orderAddressSnapshot: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        state.addressSnapshots.push(data);
        return data;
      },
    },
    shipment: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        state.shipments.push(data);
        return data;
      },
    },
    orderEvent: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        state.orderEvents.push(data);
        return data;
      },
    },
    paymentAttempt: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const attempt: FakePaymentAttempt = {
          id: `payment-attempt-${state.nextPaymentAttemptId++}`,
          orderId: String(data.orderId),
          status: data.status as PaymentAttemptStatus,
          redirectUrl: null,
          amountToman: Number(data.amountToman),
        };
        state.paymentAttempts.set(attempt.id, attempt);
        state.orders.get(attempt.orderId)?.paymentAttempts.push(attempt);
        return { id: attempt.id };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: {
          status: PaymentAttemptStatus;
          redirectUrl: string;
          providerTransactionId?: string;
        };
      }) => {
        const attempt = state.paymentAttempts.get(where.id);
        if (!attempt) throw new Error('missing fake payment attempt');
        attempt.status = data.status;
        attempt.redirectUrl = data.redirectUrl;
        return attempt;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; status: PaymentAttemptStatus };
        data: { status: PaymentAttemptStatus };
      }) => {
        const attempt = state.paymentAttempts.get(where.id);
        if (!attempt || attempt.status !== where.status) return { count: 0 };
        attempt.status = data.status;
        return { count: 1 };
      },
    },
  };

  const prisma = {
    ...client,
    $transaction: async <T>(callback: (transaction: typeof client) => Promise<T>) =>
      callback(client),
  };
  return { database: { prisma } as never, state };
}

function createFixture(options: FixtureOptions = {}) {
  const { database, state } = createDatabase();
  const gateway = options.paymentGateway ?? successfulGateway();
  let reserveCount = 0;
  let releaseCount = 0;
  const inventory = {
    reserve: async (input: { orderId?: string | null; lines: unknown[] }) => {
      reserveCount += 1;
      const reservation = {
        id: `reservation-${reserveCount}`,
        variantId: 'variant-1',
        orderId: input.orderId ?? null,
        quantity: 2,
        status: 'ACTIVE' as const,
        expiresAt: new Date(Date.now() + 900_000),
      };
      const batch: InventoryReservationBatch = {
        reservations: [reservation],
        expiresAt: reservation.expiresAt,
      };
      return batch;
    },
    release: async (reservationId: string) => {
      void reservationId;
      releaseCount += 1;
      return undefined;
    },
  };
  const service = new CheckoutService(
    database,
    { getCustomerCartForCheckout: async () => options.cart ?? cart() } as never,
    { get: async () => address() } as never,
    inventory as never,
    new FixedShippingProvider(),
    gateway,
    options.coupons,
  );
  return {
    service,
    state,
    gateway,
    get reserveCount() {
      return reserveCount;
    },
    get releaseCount() {
      return releaseCount;
    },
  };
}

const quoteInput: CheckoutQuoteInput = {
  userId: 'user-1',
  addressId: 'address-1',
  shippingMethod: 'EXPRESS',
};

test('builds an authoritative quote with live cart prices and express shipping', async () => {
  const { service } = createFixture();

  const result = await service.quote(quoteInput);

  assert.equal(result.subtotalToman, 200_000);
  assert.equal(result.shippingToman, 89_000);
  assert.equal(result.totalToman, 289_000);
  assert.equal(result.shippingLabel, 'اکسپرس');
  assert.equal(result.lines[0]?.selectedOptions[0]?.valueLabel, 'متوسط');
  assert.equal(
    result.lines[0]?.variantSnapshot && typeof result.lines[0].variantSnapshot,
    'object',
  );
});

test('does not snapshot an inherited compare-at price above the active variant price', async () => {
  const source = cart().items[0]!;
  const fixture = createFixture({
    cart: cart({
      items: [
        {
          ...source,
          variant: {
            ...source.variant,
            priceToman: 200_000,
            compareAtPriceToman: null,
            product: {
              ...source.variant.product,
              basePriceToman: 100_000,
              compareAtPriceToman: 150_000,
            },
          },
        },
      ],
    }),
  });

  const result = await fixture.service.quote(quoteInput);

  assert.equal(result.lines[0]?.unitPriceToman, 200_000);
  assert.equal(result.lines[0]?.compareAtPriceToman, null);
});

test('rejects an empty or unavailable customer cart before creating an order', async () => {
  const empty = createFixture({ cart: cart({ items: [] }) });
  await assert.rejects(empty.service.quote(quoteInput), (error: unknown) => {
    return error instanceof ConflictException;
  });

  const unavailable = createFixture({
    cart: cart({
      items: [
        {
          ...cart().items[0]!,
          variant: { ...cart().items[0]!.variant, inventory: { onHand: 2, reserved: 1 } },
        },
      ],
    }),
  });
  await assert.rejects(unavailable.service.quote(quoteInput), (error: unknown) => {
    return error instanceof ConflictException;
  });
  assert.equal(unavailable.state.orders.size, 0);
});

test('creates one idempotent order snapshot, reservation, and payment attempt', async () => {
  const fixture = createFixture();
  const input = {
    ...quoteInput,
    shippingMethod: 'STANDARD' as const,
    idempotencyKey: 'checkout-1',
  };

  const first = await fixture.service.submit(input);
  const second = await fixture.service.submit(input);

  assert.equal(first.orderId, second.orderId);
  assert.equal(first.totalToman, 200_000);
  assert.equal(first.payment.status, 'REDIRECTED');
  assert.equal(first.payment.redirectUrl, 'https://payments.example.test/checkout/transaction-1');
  assert.equal(fixture.state.orders.size, 1);
  assert.equal(fixture.state.orderItems.length, 1);
  assert.equal(fixture.state.addressSnapshots.length, 1);
  assert.equal(fixture.state.shipments.length, 1);
  assert.equal(fixture.state.orderEvents.length, 1);
  assert.equal(fixture.state.paymentAttempts.size, 1);
  assert.equal(fixture.reserveCount, 1);
  assert.equal(fixture.releaseCount, 0);
  assert.equal(fixture.gateway.starts, 1);
});

test('applies a coupon to the authoritative quote and reserves it with the order', async () => {
  const previews: Array<Record<string, unknown>> = [];
  const reservations: Array<Record<string, unknown>> = [];
  const coupons = {
    preview: async (input: Record<string, unknown>) => {
      previews.push(input);
      return {
        couponId: 'coupon-1',
        code: 'SAVE10',
        type: 'PERCENTAGE' as const,
        amount: 10,
        minimumOrderToman: 0,
        discountToman: 20_000,
      };
    },
    reserveForOrder: async (input: Record<string, unknown>) => {
      reservations.push(input);
      return { redemptionId: 'redemption-1' };
    },
  } as unknown as CouponService;
  const fixture = createFixture({ coupons });

  const result = await fixture.service.submit({
    ...quoteInput,
    shippingMethod: 'STANDARD',
    couponCode: 'save10',
    idempotencyKey: 'checkout-coupon-1',
  });

  assert.equal(result.discountToman, 20_000);
  assert.equal(result.totalToman, 180_000);
  assert.equal(previews.length, 1);
  assert.equal(previews[0]?.code, 'save10');
  assert.equal(reservations.length, 1);
  assert.equal(reservations[0]?.code, 'SAVE10');
  assert.equal([...fixture.state.orders.values()][0]?.discountToman, 20_000);
});

test('releases inventory and cancels the order when payment start fails', async () => {
  const paymentError = new Error('provider unavailable');
  const gateway: PaymentGateway & { starts: number } = {
    name: 'failing-gateway',
    starts: 0,
    startPayment: async (input: PaymentStartInput) => {
      void input;
      throw paymentError;
    },
    verifyCallback: async () => {
      throw new Error('not used by checkout tests');
    },
    refundPayment: async () => {
      throw new Error('not used by checkout tests');
    },
  };
  const fixture = createFixture({ paymentGateway: gateway });

  await assert.rejects(
    fixture.service.submit({
      userId: 'user-1',
      addressId: 'address-1',
      shippingMethod: 'STANDARD',
      idempotencyKey: 'checkout-failure-1',
    }),
    (error: unknown) => error === paymentError,
  );

  const order = [...fixture.state.orders.values()][0];
  const attempt = [...fixture.state.paymentAttempts.values()][0];
  assert.equal(order?.status, 'CANCELLED');
  assert.equal(order?.paymentStatus, 'FAILED');
  assert.equal(attempt?.status, 'FAILED');
  assert.equal(fixture.reserveCount, 1);
  assert.equal(fixture.releaseCount, 1);
  assert.equal(fixture.state.orderEvents.length, 2);
});
