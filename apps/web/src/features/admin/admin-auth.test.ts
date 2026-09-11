import assert from 'node:assert/strict';
import { test } from 'node:test';

import { QueryClient } from '@tanstack/react-query';

import { ApiClientError } from '@nova/api-client';

import {
  clearStaffSessionCache,
  handleStaffSessionFailure,
  isAdminQueryKey,
  isStaffAuthFailure,
  isStaffAuthorizationFailure,
  isStaffCurrentQueryKey,
  isStaffProtectedMutationKey,
  isStaffProtectedQueryKey,
} from './admin-auth';

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

test('identifies protected query/mutation keys and separates auth from role failures', () => {
  assert.equal(isStaffProtectedQueryKey(['admin', 'orders']), true);
  assert.equal(isStaffProtectedQueryKey(['staff-auth', 'current']), true);
  assert.equal(isStaffProtectedQueryKey(['staff-auth', 'other']), false);
  assert.equal(isStaffProtectedQueryKey(['catalog', 'products']), false);
  assert.equal(isStaffProtectedMutationKey(['admin', 'catalog']), true);
  assert.equal(isStaffProtectedMutationKey(['staff-auth', 'login']), false);
  assert.equal(isStaffProtectedMutationKey(undefined), false);
  assert.equal(isStaffAuthFailure(new ApiClientError(401)), true);
  assert.equal(isStaffAuthFailure(new ApiClientError(403)), false);
  assert.equal(isStaffAuthorizationFailure(new ApiClientError(403)), true);
  assert.equal(isStaffAuthorizationFailure(new ApiClientError(401)), false);
  assert.equal(isStaffAuthFailure(new ApiClientError(429)), false);
  assert.equal(isStaffAuthFailure(new Error('expired')), false);
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

test('clears stale protected data for a session failure but preserves it for a role denial', () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['admin', 'orders', 'list'], { id: 'admin-data' });
  queryClient.setQueryData(['staff-auth', 'current'], { id: 'staff-data' });

  assert.equal(
    handleStaffSessionFailure(queryClient, new ApiClientError(403), {
      hasStaffSession: true,
      isDevelopment: false,
    }),
    false,
  );
  assert.deepEqual(queryClient.getQueryData(['admin', 'orders', 'list']), { id: 'admin-data' });
  assert.deepEqual(queryClient.getQueryData(['staff-auth', 'current']), { id: 'staff-data' });

  assert.equal(
    handleStaffSessionFailure(queryClient, new ApiClientError(401), {
      hasStaffSession: true,
      isDevelopment: false,
    }),
    true,
  );
  assert.equal(queryClient.getQueryData(['admin', 'orders', 'list']), undefined);
  assert.equal(queryClient.getQueryData(['staff-auth', 'current']), undefined);
  queryClient.clear();
});

test('keeps the local admin preview available for an initial development auth failure', () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['admin', 'preview'], { id: 'preview-data' });

  assert.equal(
    handleStaffSessionFailure(queryClient, new ApiClientError(401), {
      hasStaffSession: false,
      isDevelopment: true,
    }),
    false,
  );
  assert.deepEqual(queryClient.getQueryData(['admin', 'preview']), { id: 'preview-data' });
  queryClient.clear();
});
