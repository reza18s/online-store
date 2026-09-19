import assert from 'node:assert/strict';
import { test } from 'node:test';

import { adminNotificationsPath } from './admin-notifications-api';

test('builds an encoded notification inspection path with operational filters', () => {
  assert.equal(
    adminNotificationsPath({ page: 2, limit: 10, kind: ' PAYMENT_SUCCEEDED ', status: 'FAILED' }),
    '/v1/admin/notifications?page=2&limit=10&kind=PAYMENT_SUCCEEDED&status=FAILED',
  );
});

test('omits an empty notification kind filter', () => {
  assert.equal(adminNotificationsPath({ kind: '   ' }), '/v1/admin/notifications');
});
