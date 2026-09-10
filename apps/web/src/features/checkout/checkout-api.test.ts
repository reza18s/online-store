import assert from 'node:assert/strict';
import { test } from 'node:test';

import { normalizeCheckoutInput } from './checkout-api';

test('normalizes optional checkout coupon input without changing shipping intent', () => {
  assert.deepEqual(
    normalizeCheckoutInput({
      addressId: 'address-1',
      shippingMethod: 'EXPRESS',
      couponCode: '  spring-20  ',
    }),
    {
      addressId: 'address-1',
      shippingMethod: 'EXPRESS',
      couponCode: 'spring-20',
    },
  );
  assert.deepEqual(
    normalizeCheckoutInput({
      addressId: 'address-1',
      shippingMethod: 'STANDARD',
      couponCode: '   ',
    }),
    { addressId: 'address-1', shippingMethod: 'STANDARD' },
  );
});
