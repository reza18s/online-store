import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ApiClientError, apiClient, type CartView } from '@nova/api-client';

import {
  getCartMergeConflicts,
  guestCartMergePath,
  mergeGuestCart,
  shouldMergeGuestCart,
} from './cart-api';

test('keeps guest-cart merge on the versioned mutation boundary', () => {
  assert.equal(guestCartMergePath, '/v1/cart/merge');
});

test('sends guest resolutions through the authenticated merge mutation', async () => {
  const originalPostEnvelope = apiClient.postEnvelope;
  let request: { path?: string; body?: unknown } = {};
  apiClient.postEnvelope = (async (path: string, body?: unknown) => {
    request = { path, body };
    return {
      data: {
        id: null,
        kind: 'CUSTOMER',
        items: [],
        itemCount: 0,
        subtotalToman: 0,
        currency: 'TOMAN',
      } satisfies CartView,
      meta: { requestId: 'request-1', timestamp: new Date().toISOString() },
    };
  }) as typeof apiClient.postEnvelope;

  try {
    await mergeGuestCart({ resolutions: [{ variantId: 'variant-1', quantity: 0 }] });
  } finally {
    apiClient.postEnvelope = originalPostEnvelope;
  }

  assert.equal(request.path, guestCartMergePath);
  assert.deepEqual(request.body, {
    resolutions: [{ variantId: 'variant-1', quantity: 0 }],
  });
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
