import assert from 'node:assert/strict';
import { test } from 'node:test';

import { QueryClient } from '@tanstack/react-query';
import { queryKeys, type CartView, type CustomerUser } from '@nova/api-client';

import {
  applyVerifiedCustomerSession,
  customerAuthLogoutPath,
  customerAuthMePath,
  customerAuthOtpRequestPath,
  customerAuthOtpVerifyPath,
  shouldDiscardCartCacheOnCustomerVerification,
} from './auth-api';

test('keeps customer auth transport paths on the versioned API boundary', () => {
  assert.equal(customerAuthMePath, '/v1/auth/me');
  assert.equal(customerAuthOtpRequestPath, '/v1/auth/otp/request');
  assert.equal(customerAuthOtpVerifyPath, '/v1/auth/otp/verify');
  assert.equal(customerAuthLogoutPath, '/v1/auth/logout');
});

test('discards only customer-owned cart cache when a different customer verifies', () => {
  assert.equal(shouldDiscardCartCacheOnCustomerVerification(undefined), false);
  assert.equal(shouldDiscardCartCacheOnCustomerVerification({ kind: 'GUEST' } as CartView), false);
  assert.equal(
    shouldDiscardCartCacheOnCustomerVerification({ kind: 'CUSTOMER' } as CartView),
    true,
  );
});

test('clears protected address and order caches before publishing the verified customer', () => {
  const queryClient = new QueryClient();
  const oldOrderListKey = queryKeys.orders.list({ page: 1, limit: 10 });
  const oldOrderDetailKey = queryKeys.orders.detail('NV-OLD');
  const oldCustomer = { id: 'customer-old' } as CustomerUser;
  const newCustomer = { id: 'customer-new' } as CustomerUser;

  queryClient.setQueryData(queryKeys.account.current(), oldCustomer);
  queryClient.setQueryData(queryKeys.account.addresses(), [{ id: 'address-old' }]);
  queryClient.setQueryData(oldOrderListKey, { items: [{ orderId: 'order-old' }] });
  queryClient.setQueryData(oldOrderDetailKey, { orderNumber: 'NV-OLD' });
  queryClient.setQueryData(queryKeys.cart.current(), { kind: 'CUSTOMER' } as CartView);

  const events: string[] = [];
  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'removed') events.push(`removed:${JSON.stringify(event.query.queryKey)}`);
    if (
      event.type === 'updated' &&
      event.query.queryKey[0] === 'account' &&
      event.query.queryKey[1] === 'current'
    ) {
      events.push('updated:account-current');
    }
  });

  applyVerifiedCustomerSession(queryClient, newCustomer);
  unsubscribe();

  const currentUpdateIndex = events.indexOf('updated:account-current');
  assert.ok(currentUpdateIndex >= 0);
  for (const key of [
    queryKeys.account.addresses(),
    oldOrderListKey,
    oldOrderDetailKey,
    queryKeys.cart.current(),
  ]) {
    const removalIndex = events.indexOf(`removed:${JSON.stringify(key)}`);
    assert.ok(removalIndex >= 0, `expected ${JSON.stringify(key)} to be removed`);
    assert.ok(removalIndex < currentUpdateIndex, `${JSON.stringify(key)} was removed too late`);
  }
  assert.equal(queryClient.getQueryData(queryKeys.account.addresses()), undefined);
  assert.equal(queryClient.getQueryData(oldOrderListKey), undefined);
  assert.equal(queryClient.getQueryData(oldOrderDetailKey), undefined);
  assert.equal(queryClient.getQueryData(queryKeys.cart.current()), undefined);
  assert.deepEqual(queryClient.getQueryData(queryKeys.account.current()), newCustomer);
  queryClient.clear();
});

test('preserves the guest cart while clearing protected caches during verification', () => {
  const queryClient = new QueryClient();
  const guestCart = { kind: 'GUEST' } as CartView;

  queryClient.setQueryData(queryKeys.account.addresses(), [{ id: 'address-old' }]);
  queryClient.setQueryData(queryKeys.orders.detail('NV-OLD'), { orderNumber: 'NV-OLD' });
  queryClient.setQueryData(queryKeys.cart.current(), guestCart);

  applyVerifiedCustomerSession(queryClient, { id: 'customer-new' } as CustomerUser);

  assert.equal(queryClient.getQueryData(queryKeys.account.addresses()), undefined);
  assert.equal(queryClient.getQueryData(queryKeys.orders.detail('NV-OLD')), undefined);
  assert.deepEqual(queryClient.getQueryData(queryKeys.cart.current()), guestCart);
  queryClient.clear();
});
