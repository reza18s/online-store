import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildDiscoveryHref,
  discoveryFacetFiltersFromQuery,
  discoveryFiltersFromQuery,
  parseDiscoveryQuery,
  preserveFacetSelection,
  productAddButtonLabel,
  resolveVariant,
  shouldShowProductLoading,
  structuredVariantOptions,
} from './storefront-discovery-page';

test('parses shareable discovery state and keeps invalid sort/page values safe', () => {
  assert.deepEqual(
    parseDiscoveryQuery(
      '?q=%D9%BE%DB%8C%D8%B1%D8%A7%D9%87%D9%86&category=shirts&size=M&sort=unknown&page=0',
    ),
    {
      q: 'پیراهن',
      category: 'shirts',
      size: 'M',
      color: '',
      material: '',
      minPrice: undefined,
      maxPrice: undefined,
      inStock: false,
      onSale: false,
      sort: 'newest',
      page: 1,
    },
  );
  assert.equal(parseDiscoveryQuery('?category=shirts', 'accessories').category, 'accessories');
  assert.equal(parseDiscoveryQuery('?onSale=true', 'sale').onSale, true);
});

test('builds URL state without losing stale selections and resets page for filter changes', () => {
  assert.equal(
    buildDiscoveryHref('#products/women', '?size=XL&page=4', { color: 'کرم' }),
    '#products/women?size=XL&color=%DA%A9%D8%B1%D9%85',
  );
  assert.equal(
    buildDiscoveryHref('#products/women', '?size=XL&page=4', { page: '5' }),
    '#products/women?size=XL&page=5',
  );
});

test('uses the same contextual filters for products and facets, without pagination or sort in facets', () => {
  const state = parseDiscoveryQuery('?q=coat&category=shirts&size=M&inStock=true&page=3&sort=name');
  assert.deepEqual(discoveryFiltersFromQuery(state, 'women'), {
    q: 'coat',
    category: 'shirts',
    audience: 'women',
    size: 'M',
    color: undefined,
    material: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    inStock: true,
    onSale: undefined,
    sort: 'name',
    page: 3,
    limit: 8,
  });
  assert.deepEqual(discoveryFacetFiltersFromQuery(state, 'women'), {
    q: 'coat',
    category: 'shirts',
    audience: 'women',
    size: 'M',
    color: undefined,
    material: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    inStock: true,
    onSale: undefined,
  });
});

test('retains a selected facet value when the contextual response no longer lists it', () => {
  const options = [{ value: 'S', label: 'کوچک', count: 2, selected: false }];
  assert.deepEqual(preserveFacetSelection(options, 'XL')[0], {
    value: 'XL',
    label: 'XL',
    count: 0,
    selected: true,
  });
  assert.deepEqual(preserveFacetSelection(options, ''), options);
});

test('resolves only a fully selected available variant for normalized options', () => {
  const product = {
    options: [
      {
        id: 'size',
        key: 'size',
        name: 'اندازه',
        sortOrder: 1,
        values: [{ id: 'm', key: 'm', label: 'M', sortOrder: 1 }],
      },
    ],
    variants: [
      {
        id: 'v1',
        sku: 'NOVA-M',
        title: 'M',
        size: null,
        color: null,
        colorHex: null,
        priceToman: 100,
        compareAtPriceToman: null,
        optionValueIds: ['m'],
        media: [],
        available: true,
      },
    ],
  };
  assert.equal(resolveVariant(product, {}, '', ''), undefined);
  assert.equal(resolveVariant(product, { size: 'm' }, '', '')?.id, 'v1');
});

test('exposes only option groups backed by variant option values', () => {
  const product = {
    options: [
      {
        id: 'size',
        key: 'size',
        name: 'اندازه',
        sortOrder: 1,
        values: [{ id: 'm', key: 'm', label: 'M', sortOrder: 1 }],
      },
      {
        id: 'material',
        key: 'material',
        name: 'جنس',
        sortOrder: 2,
        values: [{ id: 'cotton', key: 'cotton', label: 'پنبه', sortOrder: 1 }],
      },
    ],
    variants: [
      {
        id: 'v1',
        sku: 'NOVA-M',
        title: 'M',
        size: 'M',
        color: null,
        colorHex: null,
        priceToman: 100,
        compareAtPriceToman: null,
        optionValueIds: ['m'],
        media: [],
        available: true,
      },
    ],
  };

  assert.deepEqual(
    structuredVariantOptions(product).map((option) => option.key),
    ['size'],
  );
});

test('asks for a variant before presenting an unavailable add-to-cart state', () => {
  assert.equal(productAddButtonLabel(3, false, false), 'انتخاب کنید');
  assert.equal(productAddButtonLabel(3, true, true), 'افزودن به سبد خرید');
  assert.equal(productAddButtonLabel(3, true, false), 'ناموجود');
  assert.equal(productAddButtonLabel(0, false, false), 'ناموجود');
});

test('does not treat a disabled product query as loading without a slug', () => {
  assert.equal(shouldShowProductLoading('', true), false);
  assert.equal(shouldShowProductLoading('linen-overshirt', false), false);
  assert.equal(shouldShowProductLoading('linen-overshirt', true), true);
});
