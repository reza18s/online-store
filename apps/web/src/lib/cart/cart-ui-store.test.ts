import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { CartMergeConflict } from '@nova/api-client';

import { useCartUiStore } from './cart-ui-store';

const conflict: CartMergeConflict = {
  variantId: 'variant-1',
  guestQuantity: 2,
  customerQuantity: 1,
  availableQuantity: 2,
  mergedQuantity: 1,
  reason: 'STOCK_LIMIT',
};

test('keeps local merge resolutions together and resets cart UI state', () => {
  const store = useCartUiStore.getState();
  store.reset();

  store.setMergeConflicts([conflict]);
  store.setMergeResolution('variant-1', 1);
  store.setFeedback({ message: 'retry', error: true });

  assert.deepEqual(useCartUiStore.getState().mergeConflicts, [conflict]);
  assert.deepEqual(useCartUiStore.getState().mergeResolutions, { 'variant-1': 1 });
  assert.deepEqual(useCartUiStore.getState().feedback, { message: 'retry', error: true });

  store.reset();
  assert.deepEqual(useCartUiStore.getState().mergeConflicts, []);
  assert.deepEqual(useCartUiStore.getState().mergeResolutions, {});
  assert.equal(useCartUiStore.getState().feedback, undefined);
});
