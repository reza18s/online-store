import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  customerAuthLogoutPath,
  customerAuthMePath,
  customerAuthOtpRequestPath,
  customerAuthOtpVerifyPath,
  shouldDiscardCartCacheOnCustomerVerification,
} from './auth-api';
import type { CartView } from '@nova/api-client';

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
