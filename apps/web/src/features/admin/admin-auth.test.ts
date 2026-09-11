import assert from 'node:assert/strict';
import { test } from 'node:test';

import { QueryClient } from '@tanstack/react-query';

import { clearStaffSessionCache, isAdminQueryKey, isStaffCurrentQueryKey } from './admin-auth';

test('matches every admin-scoped query key and no storefront or customer key', () => {
  assert.equal(isAdminQueryKey(['admin', 'catalog', 'products']), true);
  assert.equal(isAdminQueryKey(['admin', 'anything']), true);
  assert.equal(isAdminQueryKey(['catalog', 'products']), false);
  assert.equal(isAdminQueryKey(['cart', 'current']), false);
  assert.equal(isAdminQueryKey(['account', 'current']), false);
});

test('matches only the staff current query key', () => {
  assert.equal(isStaffCurrentQueryKey(['staff-auth', 'current']), true);
  assert.equal(isStaffCurrentQueryKey(['staff-auth', 'current', 'extra']), false);
  assert.equal(isStaffCurrentQueryKey(['staff-auth', 'other']), false);
  assert.equal(isStaffCurrentQueryKey(['account', 'current']), false);
});

test('clears admin and staff session queries without clearing customer or cart queries', () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['admin', 'orders', 'list'], { id: 'admin-data' });
  queryClient.setQueryData(['staff-auth', 'current'], { id: 'staff-data' });
  queryClient.setQueryData(['account', 'current'], { id: 'customer-data' });
  queryClient.setQueryData(['cart', 'current'], { id: 'cart-data' });

  clearStaffSessionCache(queryClient);

  assert.equal(queryClient.getQueryData(['admin', 'orders', 'list']), undefined);
  assert.equal(queryClient.getQueryData(['staff-auth', 'current']), undefined);
  assert.deepEqual(queryClient.getQueryData(['account', 'current']), { id: 'customer-data' });
  assert.deepEqual(queryClient.getQueryData(['cart', 'current']), { id: 'cart-data' });
  queryClient.clear();
});
