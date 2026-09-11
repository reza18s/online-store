import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ApiClientError } from '@nova/api-client';

import {
  buildCheckoutHref,
  classifyCheckoutFailure,
  getStableCheckoutIdempotencyKey,
  isQuoteExpired,
  normalizeCheckoutStep,
  parseCheckoutRouteParams,
  paymentRecoveryCopy,
} from './checkout-state';

function apiError(status: number, code: string, message: string): ApiClientError {
  return new ApiClientError(status, {
    error: {
      code,
      message,
      statusCode: status,
      requestId: 'test-request',
      timestamp: '2026-09-11T00:00:00.000Z',
    },
  });
}

test('keeps checkout route state normalized and preserves only safe step input', () => {
  assert.deepEqual(
    parseCheckoutRouteParams(
      '?addressId=addr%2F1&shipping=EXPRESS&coupon=%20SAVE10%20&status=timeout',
    ),
    {
      addressId: 'addr/1',
      shippingMethod: 'EXPRESS',
      couponCode: 'SAVE10',
      orderNumber: '',
      paymentState: 'timeout',
    },
  );
  assert.equal(normalizeCheckoutStep('unknown'), 'address');
  assert.equal(
    buildCheckoutHref('payment', {
      addressId: 'addr/1',
      shippingMethod: 'EXPRESS',
      couponCode: ' SAVE10 ',
    }),
    '#checkout/payment?addressId=addr%2F1&shipping=EXPRESS&coupon=SAVE10',
  );
});

test('reuses the idempotency key for the same checkout input and rotates it when input changes', () => {
  const values = new Map<string, string>();
  const storage: Storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: () => undefined,
    clear: () => values.clear(),
    key: () => null,
    length: 0,
  };
  const input = { addressId: 'address-1', shippingMethod: 'STANDARD' as const };
  const first = getStableCheckoutIdempotencyKey(input, storage);
  assert.equal(getStableCheckoutIdempotencyKey(input, storage), first);
  assert.notEqual(
    getStableCheckoutIdempotencyKey({ ...input, shippingMethod: 'EXPRESS' }, storage),
    first,
  );
});

test('detects expired quotes and maps commerce failures to safe next actions', () => {
  assert.equal(
    isQuoteExpired(
      {
        cartId: 'cart-1',
        address: {} as never,
        shippingMethod: 'STANDARD',
        shippingLabel: 'ارسال عادی',
        shippingEstimate: '۲ تا ۴ روز کاری',
        lines: [],
        subtotalToman: 100,
        discountToman: 0,
        coupon: null,
        shippingToman: 0,
        taxToman: 0,
        totalToman: 100,
        currency: 'TOMAN',
        expiresAt: '2026-09-10T00:00:00.000Z',
      },
      Date.parse('2026-09-11T00:00:00.000Z'),
    ),
    true,
  );
  assert.equal(
    classifyCheckoutFailure(apiError(409, 'CONFLICT', 'موجودی یکی از کالاها تغییر کرده است.'))
      .action,
    'cart',
  );
  assert.equal(
    classifyCheckoutFailure(apiError(409, 'CONFLICT', 'قیمت سفارش تغییر کرده است.')).kind,
    'price-change',
  );
  assert.equal(
    classifyCheckoutFailure(apiError(503, 'SERVICE_UNAVAILABLE', 'درگاه پرداخت پیکربندی نشده است.'))
      .kind,
    'payment-unavailable',
  );
  assert.equal(
    classifyCheckoutFailure(apiError(401, 'UNAUTHORIZED', 'نشست منقضی شده است.')).action,
    'login',
  );
});

test('payment recovery copy tells the customer not to retry a pending payment blindly', () => {
  assert.match(paymentRecoveryCopy('pending').message, /دوباره پرداخت نکنید/);
  assert.equal(paymentRecoveryCopy('failed').actionLabel, 'بازگشت به پرداخت');
  assert.equal(paymentRecoveryCopy('timeout').actionLabel, 'مشاهده وضعیت سفارش');
});
