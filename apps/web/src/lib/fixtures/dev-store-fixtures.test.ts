import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addFakeCartItem,
  fakeCatalogCategories,
  getFakeCatalogFacets,
  getFakeCatalogProduct,
  getFakeCatalogProducts,
  getFakeCart,
  getFakeContentPage,
} from './dev-store-fixtures';

test('provides a complete local catalog for storefront previews', () => {
  assert.ok(fakeCatalogCategories.some((category) => category.slug === 'women'));
  const women = getFakeCatalogProducts({ audience: 'women', limit: 20 });
  assert.equal(getFakeCatalogProducts({ limit: 100 }).total, 40);
  assert.equal(women.items.length, 19);
  assert.ok(women.items.every((product) => product.imageUrl?.startsWith('/assets/')));
  assert.ok(getFakeCatalogProduct('linen-overshirt').variants.length > 0);
});

test('keeps the expanded catalog paginable for listing screens', () => {
  const finalPage = getFakeCatalogProducts({ page: 5, limit: 8 });
  assert.equal(finalPage.total, 40);
  assert.equal(finalPage.items.length, 8);
  assert.equal(finalPage.page, 5);
});

test('deduplicates catalog facet values for native select controls', () => {
  const colorOptions =
    getFakeCatalogFacets().groups.find((group) => group.key === 'color')?.options ?? [];
  assert.equal(new Set(colorOptions.map((option) => option.value)).size, colorOptions.length);
});

test('supports local search and sale filters without changing API contracts', () => {
  const results = getFakeCatalogProducts({ q: 'لینن', onSale: true, limit: 8 });
  assert.deepEqual(
    results.items.map((product) => product.slug),
    ['linen-overshirt', 'linen-daily-dress'],
  );
  assert.equal(results.total, 2);
});

test('seeds an interactive guest cart with real-looking product lines', () => {
  const initial = getFakeCart();
  assert.equal(initial.kind, 'GUEST');
  assert.equal(initial.itemCount, 3);
  const updated = addFakeCartItem('knit-cardigan-variant-m', 1);
  assert.equal(updated.itemCount, 4);
  assert.ok(updated.items.some((item) => item.productSlug === 'knit-cardigan'));
});

test('returns a published editorial fixture for valid content routes', () => {
  const page = getFakeContentPage('article');
  assert.equal(page.slug, 'article');
  assert.ok(page.title.length > 0);
  assert.ok(page.blocks.length >= 3);
});
