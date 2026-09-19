import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ApiClientError } from '@nova/api-client';

import {
  buildCheckoutHref,
  classifyCheckoutFailure,
  checkoutFormStateFromRoute,
  checkoutRetryTarget,
  getStableCheckoutIdempotencyKey,
  isConfirmedTerminalPaymentStartFailure,
  isQuoteExpired,
  normalizeCheckoutStep,
  parseCheckoutRouteParams,
  paymentRecoveryCopy,
  rotateCheckoutIdempotencyKey,
  shouldShowNewAddressFromRoute,
  shouldShowCheckoutOrderLoading,
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

test('clears stale checkout values when a route transition omits address and coupon', () => {
  const populated = checkoutFormStateFromRoute(
    parseCheckoutRouteParams('?addressId=address-1&shipping=EXPRESS&coupon=SAVE10'),
  );
  const cleared = checkoutFormStateFromRoute(parseCheckoutRouteParams('?'));

  assert.deepEqual(populated, {
    addressId: 'address-1',
    shippingMethod: 'EXPRESS',
    couponCode: 'SAVE10',
  });
  assert.deepEqual(cleared, {
    addressId: '',
    shippingMethod: 'STANDARD',
    couponCode: '',
  });
});

test('clears the new-address form marker when a route transition omits it', () => {
  assert.equal(shouldShowNewAddressFromRoute('?newAddress=1'), true);
  assert.equal(shouldShowNewAddressFromRoute('?addressId=address-1'), false);
});

test('does not show order loading when the recovery link has no order number', () => {
  assert.equal(shouldShowCheckoutOrderLoading('', true), false);
  assert.equal(shouldShowCheckoutOrderLoading('NV-TEST-001', false), false);
  assert.equal(shouldShowCheckoutOrderLoading('NV-TEST-001', true), true);
});

test('reuses the idempotency key for the same checkout quote and rotates it when checkout state changes', () => {
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
  const quote = {
    cartId: 'cart-1',
    lines: [
      { cartItemId: 'line-1', variantId: 'variant-1', quantity: 1 },
      { cartItemId: 'line-2', variantId: 'variant-2', quantity: 2 },
    ],
  } as const;
  const first = getStableCheckoutIdempotencyKey(input, quote, storage);
  assert.equal(getStableCheckoutIdempotencyKey(input, quote, storage), first);
  assert.notEqual(
    getStableCheckoutIdempotencyKey({ ...input, shippingMethod: 'EXPRESS' }, quote, storage),
    first,
  );
  assert.notEqual(
    getStableCheckoutIdempotencyKey(input, { ...quote, cartId: 'cart-2' }, storage),
    first,
  );
  assert.notEqual(
    getStableCheckoutIdempotencyKey(
      input,
      {
        ...quote,
        lines: quote.lines.map((line) =>
          line.cartItemId === 'line-1' ? { ...line, quantity: 2 } : line,
        ),
      },
      storage,
    ),
    first,
  );
});

test('rotates and persists a new checkout key only for an explicit terminal payment-start retry', () => {
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
  const quote = {
    cartId: 'cart-1',
    lines: [{ cartItemId: 'line-1', variantId: 'variant-1', quantity: 1 }],
  } as const;
  const stable = getStableCheckoutIdempotencyKey(input, quote, storage);
  const rotated = rotateCheckoutIdempotencyKey(input, quote, storage);

  assert.notEqual(rotated, stable);
  assert.equal(getStableCheckoutIdempotencyKey(input, quote, storage), rotated);
});

test('distinguishes the confirmed terminal payment-start response from uncertain failures', () => {
  const terminal = apiError(503, 'SERVICE_UNAVAILABLE', 'درگاه پرداخت پیکربندی نشده است.');
  const genericServerFailure = apiError(500, 'INTERNAL_ERROR', 'خطای داخلی سرویس.');
  const unrelatedUnavailable = apiError(
    503,
    'SERVICE_UNAVAILABLE',
    'درگاه پرداخت موقتاً در دسترس نیست.',
  );

  assert.equal(isConfirmedTerminalPaymentStartFailure(terminal), true);
  assert.equal(isConfirmedTerminalPaymentStartFailure(genericServerFailure), false);
  assert.equal(isConfirmedTerminalPaymentStartFailure(unrelatedUnavailable), false);
  assert.equal(isConfirmedTerminalPaymentStartFailure(new TypeError('Failed to fetch')), false);
  assert.equal(classifyCheckoutFailure(terminal).action, 'retry');
  assert.equal(classifyCheckoutFailure(terminal).actionLabel, 'شروع دوباره پرداخت');
  assert.equal(checkoutRetryTarget(classifyCheckoutFailure(terminal), 'submit'), 'submit');
  assert.equal(classifyCheckoutFailure(unrelatedUnavailable).action, 'payment');
  assert.equal(
    classifyCheckoutFailure(terminal).message,
    'تلاش قبلی لغو شده است؛ پس از پیکربندی درگاه واقعی، پرداخت را دوباره از همین مرحله شروع کنید.',
  );
  assert.match(classifyCheckoutFailure(genericServerFailure).message, /نتیجه ثبت سفارش قطعی نیست/);
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

test('routes retryable checkout failures to the operation that failed', () => {
  const retryableFailure = {
    kind: 'network' as const,
    title: 'سرویس موقتاً پاسخ نمی‌دهد',
    message: 'دوباره تلاش کنید.',
    actionLabel: 'تلاش دوباره',
    action: 'retry' as const,
  };
  assert.equal(checkoutRetryTarget(retryableFailure, 'submit'), 'submit');
  assert.equal(checkoutRetryTarget(retryableFailure, 'quote'), 'quote');
  assert.equal(checkoutRetryTarget(retryableFailure, 'address'), null);
  assert.equal(checkoutRetryTarget({ ...retryableFailure, action: 'cart' }, 'submit'), null);
  assert.equal(
    checkoutRetryTarget(
      {
        ...retryableFailure,
        kind: 'payment-unavailable',
        action: 'retry',
      },
      'submit',
    ),
    'submit',
  );
  assert.equal(
    checkoutRetryTarget(
      {
        ...retryableFailure,
        kind: 'payment-unavailable',
        action: 'payment',
      },
      'submit',
    ),
    null,
  );
});

test('payment recovery copy tells the customer not to retry a pending payment blindly', () => {
  assert.match(paymentRecoveryCopy('pending').message, /دوباره پرداخت نکنید/);
  assert.equal(paymentRecoveryCopy('failed').actionLabel, 'بازگشت به پرداخت');
  assert.equal(paymentRecoveryCopy('timeout').actionLabel, 'مشاهده وضعیت سفارش');
});
