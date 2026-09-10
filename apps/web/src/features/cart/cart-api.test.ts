import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ApiClientError, type CartView } from '@nova/api-client';

import { getCartMergeConflicts, guestCartMergePath, shouldMergeGuestCart } from './cart-api';

test('keeps guest-cart merge on the versioned mutation boundary', () => {
  assert.equal(guestCartMergePath, '/v1/cart/merge');
});

test('decodes only the bounded cart merge conflict details from an API error', () => {
  const error = new ApiClientError(409, {
    error: {
      code: 'CART_MERGE_CONFLICT',
      message: 'بخشی از سبد خرید قابل ادغام نیست.',
      statusCode: 409,
      requestId: 'request-1',
      timestamp: new Date().toISOString(),
      details: {
        conflicts: [
          {
            variantId: 'variant-1',
            reason: 'STOCK_LIMIT',
            guestQuantity: 2,
            customerQuantity: 1,
            mergedQuantity: 3,
            availableQuantity: 2,
          },
          { variantId: 'malformed', reason: 'UNKNOWN' },
        ],
      },
    },
  });

  assert.deepEqual(getCartMergeConflicts(error), [
    {
      variantId: 'variant-1',
      reason: 'STOCK_LIMIT',
      guestQuantity: 2,
      customerQuantity: 1,
      mergedQuantity: 3,
      availableQuantity: 2,
    },
  ]);
  assert.deepEqual(getCartMergeConflicts(new Error('not a merge conflict')), []);
});

test('merges only a cached guest cart after a customer session is available', () => {
  assert.equal(shouldMergeGuestCart(undefined, 'customer-1'), false);
  assert.equal(shouldMergeGuestCart({ kind: 'CUSTOMER' } as CartView, 'customer-1'), false);
  assert.equal(shouldMergeGuestCart({ kind: 'GUEST' } as CartView), false);
  assert.equal(shouldMergeGuestCart({ kind: 'GUEST' } as CartView, 'customer-1'), true);
});
