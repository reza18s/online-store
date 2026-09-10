import assert from 'node:assert/strict';
import { test } from 'node:test';

import { adminPaymentsPath } from './admin-payments-api';

test('builds an encoded admin payment path with filters', () => {
  assert.equal(
    adminPaymentsPath({
      page: 2,
      limit: 24,
      status: 'FAILED',
      provider: ' fake-gateway ',
      orderNumber: 'NV-42',
    }),
    '/v1/admin/payments?page=2&limit=24&status=FAILED&provider=fake-gateway&orderNumber=NV-42',
  );
});

test('omits empty admin payment filters', () => {
  assert.equal(adminPaymentsPath({ provider: '   ', orderNumber: 'NV-42' }), '/v1/admin/payments?orderNumber=NV-42');
});
