import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  adminOrderReturnPath,
  adminOrderShipmentPath,
  adminOrderStatusPath,
  adminOrdersPath,
} from './admin-orders-api';

test('builds an admin order list path with search and status filters', () => {
  assert.equal(
    adminOrdersPath({
      page: 2,
      limit: 24,
      q: '  NV-ABC-001  ',
      status: 'SHIPPED',
      paymentStatus: 'PAID',
    }),
    '/v1/admin/orders?page=2&limit=24&q=NV-ABC-001&status=SHIPPED&paymentStatus=PAID',
  );
});

test('omits an empty admin order search term', () => {
  assert.equal(adminOrdersPath({ q: '   ' }), '/v1/admin/orders');
});

test('encodes admin order mutation paths', () => {
  assert.equal(adminOrderStatusPath('NV/ABC 001'), '/v1/admin/orders/NV%2FABC%20001/status');
  assert.equal(adminOrderShipmentPath('NV/ABC 001'), '/v1/admin/orders/NV%2FABC%20001/shipment');
  assert.equal(adminOrderReturnPath('NV/ABC 001'), '/v1/admin/orders/NV%2FABC%20001/return');
});
