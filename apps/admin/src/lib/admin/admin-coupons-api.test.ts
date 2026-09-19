import assert from 'node:assert/strict';
import { test } from 'node:test';

import { adminCouponsPath } from './admin-coupons-api';

test('builds an encoded admin coupon list path with status filters', () => {
  assert.equal(
    adminCouponsPath({ q: ' SAVE10 ', status: 'ACTIVE', page: 2, limit: 12 }),
    '/v1/admin/coupons?q=SAVE10&status=ACTIVE&page=2&limit=12',
  );
});

test('omits empty admin coupon search terms', () => {
  assert.equal(adminCouponsPath({ q: '   ', status: 'ALL' }), '/v1/admin/coupons?status=ALL');
});
