import assert from 'node:assert/strict';
import { test } from 'node:test';

import { queryKeys } from '@nova/api-client';

import { adminCatalogProductPath, adminCatalogProductsPath } from './admin-catalog-api';

test('builds normalized admin catalog list paths', () => {
  assert.equal(
    adminCatalogProductsPath({
      page: 2,
      limit: 24,
      q: '  لینن  ',
      status: 'DRAFT',
      category: 'outerwear',
    }),
    '/v1/admin/catalog/products?page=2&limit=24&q=%D9%84%DB%8C%D9%86%D9%86&status=DRAFT&category=outerwear',
  );
  assert.equal(adminCatalogProductsPath({ q: '' }), '/v1/admin/catalog/products');
  assert.equal(
    adminCatalogProductsPath({ page: 1, limit: 12, lowStock: true }),
    '/v1/admin/catalog/products?page=1&limit=12&lowStock=true',
  );
});

test('builds encoded admin catalog product detail paths', () => {
  assert.equal(
    adminCatalogProductPath('product/with spaces?and=query'),
    '/v1/admin/catalog/products/product%2Fwith%20spaces%3Fand%3Dquery',
  );
});

test('uses a distinct per-product admin catalog detail query key', () => {
  assert.deepEqual(queryKeys.adminCatalog.product('product-42'), [
    'admin',
    'catalog',
    'product',
    'product-42',
  ]);
});
