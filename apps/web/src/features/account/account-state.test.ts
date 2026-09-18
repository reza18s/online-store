import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { CustomerOrderDetail } from '@nova/api-client';

import {
  addressFormIsComplete,
  findCustomerAddressByRouteId,
  getSubmittedOrderForRoute,
} from './account-pages';
import {
  CUSTOMER_RETURN_WINDOW_DAYS,
  canCancelCustomerOrder,
  getReturnEligibility,
  getReturnOrderState,
  shouldShowCustomerOrderLoading,
} from './account-state';

function order(overrides: Partial<CustomerOrderDetail> = {}): CustomerOrderDetail {
  return {
    orderId: 'order-1',
    orderNumber: 'NV-TEST-001',
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    subtotalToman: 100,
    discountToman: 0,
    shippingToman: 0,
    taxToman: 0,
    totalToman: 100,
    currency: 'TOMAN',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    items: [],
    address: null,
    payment: null,
    shipment: {
      provider: 'local',
      method: 'STANDARD',
      trackingReference: 'TRK-001',
      status: 'DELIVERED',
      shippedAt: '2026-09-02T00:00:00.000Z',
      deliveredAt: '2026-09-03T00:00:00.000Z',
    },
    events: [],
    refunds: [],
    returnRequest: null,
    ...overrides,
  };
}

test('exposes cancellation only for server-supported customer order states', () => {
  assert.equal(canCancelCustomerOrder({ status: 'PENDING_PAYMENT' }), true);
  assert.equal(canCancelCustomerOrder({ status: 'CONFIRMED' }), true);
  assert.equal(canCancelCustomerOrder({ status: 'PREPARING' }), false);
  assert.equal(canCancelCustomerOrder({ status: 'DELIVERED' }), false);
});

test('keeps return eligibility aligned with payment, delivery, request and seven-day rules', () => {
  const now = new Date('2026-09-10T00:00:00.000Z');
  assert.deepEqual(getReturnEligibility(order(), now), { eligible: true, reason: 'eligible' });
  assert.deepEqual(getReturnEligibility(order({ status: 'SHIPPED' }), now), {
    eligible: false,
    reason: 'not-delivered',
  });
  assert.deepEqual(getReturnEligibility(order({ paymentStatus: 'PENDING' }), now), {
    eligible: false,
    reason: 'payment-unconfirmed',
  });
  assert.deepEqual(
    getReturnEligibility(
      order({ returnRequest: { id: 'return-1' } as CustomerOrderDetail['returnRequest'] }),
      now,
    ),
    { eligible: false, reason: 'already-requested' },
  );
  assert.deepEqual(
    getReturnEligibility(
      order({ shipment: { ...order().shipment!, deliveredAt: '2026-09-02T23:59:59.000Z' } }),
      now,
    ),
    { eligible: false, reason: 'expired' },
  );
  assert.equal(CUSTOMER_RETURN_WINDOW_DAYS, 7);
});

test('keeps the return status route visible before a request exists', () => {
  const now = new Date('2026-09-10T00:00:00.000Z');

  assert.equal(getReturnOrderState(order(), now), 'not-requested');
  assert.equal(getReturnOrderState(order({ status: 'SHIPPED' }), now), 'ineligible');
  assert.equal(
    getReturnOrderState(
      order({ returnRequest: { id: 'return-1' } as CustomerOrderDetail['returnRequest'] }),
      now,
    ),
    'requested',
  );
});

test('requires every server-required address field before allowing a save', () => {
  const form = {
    label: 'خانه',
    recipientName: 'مشتری نوا',
    phone: '09120000000',
    province: 'تهران',
    city: 'تهران',
    addressLine: 'خیابان نمونه، پلاک ۱',
    postalCode: '1234567890',
    isDefault: false,
  };
  assert.equal(addressFormIsComplete(form), true);
  assert.equal(addressFormIsComplete({ ...form, city: '  ' }), false);
});

test('matches an encoded address edit route to the customer address id', () => {
  const addresses = [
    {
      id: 'address/1',
      label: 'خانه',
      recipientName: 'مشتری نوا',
      phone: '09120000000',
      province: 'تهران',
      city: 'تهران',
      addressLine: 'خیابان نمونه، پلاک ۱',
      postalCode: '1234567890',
      isDefault: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
  ];

  assert.equal(
    findCustomerAddressByRouteId(addresses, encodeURIComponent('address/1')),
    addresses[0],
  );
});

test('does not let a disabled order query keep an unauthenticated route in loading', () => {
  assert.equal(
    shouldShowCustomerOrderLoading({
      customerPending: false,
      customerActive: false,
      hasOrderNumber: true,
      orderPending: true,
    }),
    false,
  );
  assert.equal(
    shouldShowCustomerOrderLoading({
      customerPending: false,
      customerActive: true,
      hasOrderNumber: true,
      orderPending: true,
    }),
    true,
  );
  assert.equal(
    shouldShowCustomerOrderLoading({
      customerPending: false,
      customerActive: true,
      hasOrderNumber: false,
      orderPending: true,
    }),
    false,
  );
});

test('does not reuse a submitted return response after the order route changes', () => {
  const submittedOrder = { routeOrderNumber: 'NV-TEST-001', order: order() };

  assert.equal(getSubmittedOrderForRoute(submittedOrder, 'NV-TEST-001'), submittedOrder.order);
  assert.equal(getSubmittedOrderForRoute(submittedOrder, 'NV-TEST-002'), undefined);
});
