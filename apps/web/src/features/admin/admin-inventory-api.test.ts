import assert from 'node:assert/strict';
import { test } from 'node:test';

import { adminInventoryItemsPath } from './admin-inventory-api';

test('builds an encoded admin inventory list path', () => {
  assert.equal(
    adminInventoryItemsPath({
      page: 2,
      limit: 24,
      q: '  کت پیشمی  ',
      lowStock: true,
      status: 'ACTIVE',
    }),
    '/v1/admin/inventory/items?page=2&limit=24&q=%DA%A9%D8%AA+%D9%BE%DB%8C%D8%B4%D9%85%DB%8C&lowStock=true&status=ACTIVE',
  );
});

test('omits an empty admin inventory search term', () => {
  assert.equal(
    adminInventoryItemsPath({ q: '   ', status: 'ALL' }),
    '/v1/admin/inventory/items?status=ALL',
  );
});
