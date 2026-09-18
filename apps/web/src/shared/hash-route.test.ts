import assert from 'node:assert/strict';
import { test } from 'node:test';

import { hashRouteFromLocation, parseHashRoute } from './hash-route';

function assertRoute(route: string, expected: Record<string, unknown>): void {
  const actual = parseHashRoute(route) as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(actual[key], value, `${route} should resolve ${key}`);
  }
}

test('adapts React Router locations to the app hash-route contract', () => {
  assert.equal(
    hashRouteFromLocation({ pathname: '/admin/orders', search: '?q=paid' }),
    '#admin/orders?q=paid',
  );
  assert.equal(
    hashRouteFromLocation({ pathname: '/product/linen-overshirt', search: '' }),
    '#product/linen-overshirt',
  );
  assert.equal(hashRouteFromLocation({ pathname: '/', search: '' }), '#home');
});

test('keeps storefront home aliases and query strings explicit', () => {
  assertRoute('#home', { kind: 'home', path: '#home', queryString: '' });
  assertRoute('#', { kind: 'home', path: '#', queryString: '' });
  assertRoute('#search', { kind: 'home', path: '#search' });
  assertRoute('#products?q=%D8%B4%D8%A7%D9%84', {
    kind: 'products',
    mode: '',
    queryString: 'q=%D8%B4%D8%A7%D9%84',
  });
});

test('resolves catalog and product routes without changing path values', () => {
  assertRoute('#category/women', {
    kind: 'category',
    audience: 'women',
  });
  assertRoute('#category/unknown', { kind: 'category' });
  assertRoute('#products/men?sort=price_desc', {
    kind: 'products',
    mode: 'men',
    audience: 'men',
    queryString: 'sort=price_desc',
  });
  assertRoute('#products/accessories', {
    kind: 'products',
    mode: 'accessories',
  });
  assertRoute('#product/linen-overshirt', {
    kind: 'product',
    slug: 'linen-overshirt',
  });
  assertRoute('#product/', { kind: 'not-found' });
});

test('keeps cart, checkout, and account route precedence', () => {
  assertRoute('#cart/empty', { kind: 'cart' });
  assertRoute('#cart/conflict', { kind: 'cart' });
  assertRoute('#checkout/payment-pending', {
    kind: 'preview-state',
    state: 'payment-pending',
  });
  assertRoute('#checkout/payment?addressId=address-1', {
    kind: 'checkout',
    step: 'payment',
    queryString: 'addressId=address-1',
  });
  assertRoute('#checkout/confirmation?orderNumber=NV-1', {
    kind: 'checkout-confirmation',
    queryString: 'orderNumber=NV-1',
  });
  assertRoute('#checkout/local-payment?orderNumber=NV-1', {
    kind: 'local-payment',
    queryString: 'orderNumber=NV-1',
  });
  assertRoute('#account', { kind: 'account' });
  assertRoute('#account/orders', { kind: 'account', section: 'orders' });
  assertRoute('#account/addresses', { kind: 'address-list' });
  assertRoute('#account/addresses/create', { kind: 'address-create' });
  assertRoute('#account/addresses/edit/address-1', {
    kind: 'address-edit',
    addressId: 'address-1',
  });
});

test('resolves order, return, editorial, state, admin, and fallback routes', () => {
  assertRoute('#order/NV-1405%2F2481', {
    kind: 'order',
    orderNumber: 'NV-1405/2481',
  });
  assertRoute('#return/request?orderNumber=NV-1', {
    kind: 'return',
    status: false,
    queryString: 'orderNumber=NV-1',
  });
  assertRoute('#return/status', { kind: 'return', status: true });
  assertRoute('#support', { kind: 'editorial', page: 'support' });
  assertRoute('#state/offline', {
    kind: 'preview-state',
    state: 'offline',
  });
  assertRoute('#admin/products', { kind: 'admin', page: 'products' });
  assertRoute('#admin', { kind: 'admin', page: 'admin' });
  assertRoute('#does-not-exist', { kind: 'not-found' });
});

test('supports published content aliases without changing existing editorial routes', () => {
  assertRoute('#content/size-guide', {
    kind: 'content',
    slug: 'size-guide',
    path: '#content/size-guide',
    queryString: '',
  });
  assertRoute('#size-guide', { kind: 'editorial', page: 'size-guide' });
});
