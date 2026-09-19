import assert from 'node:assert/strict';
import { test } from 'node:test';

import { adminCustomersPath } from './admin-customers-api';

test('builds an encoded admin customer lookup path', () => {
  assert.equal(
    adminCustomersPath({ page: 2, limit: 12, q: '  customer@example.test  ', status: 'ACTIVE' }),
    '/v1/admin/customers?page=2&limit=12&q=customer%40example.test&status=ACTIVE',
  );
});

test('omits an empty admin customer search term', () => {
  assert.equal(adminCustomersPath({ q: '   ' }), '/v1/admin/customers');
});
