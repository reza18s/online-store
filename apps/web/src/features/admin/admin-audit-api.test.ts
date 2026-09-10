import assert from 'node:assert/strict';
import { test } from 'node:test';

import { adminAuditEventsPath } from './admin-audit-api';

test('builds an encoded admin audit event path with filters', () => {
  assert.equal(
    adminAuditEventsPath({
      page: 2,
      limit: 50,
      action: ' order.cancelled ',
      resourceType: 'Order',
      actorType: 'STAFF',
    }),
    '/v1/admin/audit-events?page=2&limit=50&action=order.cancelled&resourceType=Order&actorType=STAFF',
  );
});

test('omits empty admin audit filters', () => {
  assert.equal(adminAuditEventsPath({ action: '   ', actorType: 'SYSTEM' }), '/v1/admin/audit-events?actorType=SYSTEM');
});
