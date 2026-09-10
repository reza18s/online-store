import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  customerOrderCancelPath,
  customerOrderReturnPath,
  customerOrdersPath,
} from './orders-api';

test('builds an order list path with optional status filters', () => {
  assert.equal(
    customerOrdersPath({ page: 2, limit: 10, status: 'SHIPPED' }),
    '/v1/account/orders?page=2&limit=10&status=SHIPPED',
  );
});

test('omits empty order list filters', () => {
  assert.equal(customerOrdersPath({}), '/v1/account/orders');
});

test('encodes customer order action paths', () => {
  assert.equal(
    customerOrderCancelPath('NV/ABC 001'),
    '/v1/account/orders/NV%2FABC%20001/cancel',
  );
  assert.equal(
    customerOrderReturnPath('NV/ABC 001'),
    '/v1/account/orders/NV%2FABC%20001/returns',
  );
});
