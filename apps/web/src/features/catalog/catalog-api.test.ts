import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  catalogCategoriesPath,
  catalogFacetsPath,
  catalogFacetsRequestPath,
  catalogRequestPath,
  catalogSearchSuggestionsPath,
  catalogSuggestionsRequestPath,
  toStorefrontProduct,
} from './catalog-api';

test('keeps public catalog categories on the versioned read boundary', () => {
  assert.equal(catalogCategoriesPath, '/v1/catalog/categories');
});

test('keeps catalog facets contextual and independent from pagination', () => {
  assert.equal(catalogFacetsPath, '/v1/catalog/facets');
  assert.equal(
    catalogFacetsRequestPath({ q: 'پیراهن', audience: 'women', category: 'shirts', size: 'M' }),
    '/v1/catalog/facets?q=%D9%BE%DB%8C%D8%B1%D8%A7%D9%87%D9%86&audience=women&category=shirts&size=M',
  );
});

test('keeps search suggestions on a bounded, versioned transport path', () => {
  assert.equal(catalogSearchSuggestionsPath, '/v1/search/suggestions');
  assert.equal(
    catalogSuggestionsRequestPath('پیراهن', 6),
    '/v1/search/suggestions?q=%D9%BE%DB%8C%D8%B1%D8%A7%D9%87%D9%86&limit=6',
  );
});

test('routes search filters to the search endpoint and preserves query parameters', () => {
  assert.equal(
    catalogRequestPath({ q: 'پیراهن', audience: 'women', page: 2, limit: 12 }),
    '/v1/search?q=%D9%BE%DB%8C%D8%B1%D8%A7%D9%87%D9%86&audience=women&page=2&limit=12',
  );
});

test('maps authoritative catalog summaries to storefront-safe product data', () => {
  const product = toStorefrontProduct({
    id: 'product-1',
    slug: 'linen-shirt',
    name: 'پیراهن لینن',
    priceToman: 1_200_000,
    compareAtPriceToman: 1_500_000,
    available: true,
    imageUrl: '/media/linen.webp',
    imageAlt: 'پیراهن لینن',
    categories: [
      { id: 'women', slug: 'women', name: 'زنانه' },
      { id: 'shirts', slug: 'shirts', name: 'پیراهن' },
    ],
    options: [],
    variants: [],
    colors: [{ name: 'کرم', hex: '#d9c8ad' }],
    stockStatus: 'IN_STOCK',
  });

  assert.deepEqual(product, {
    id: 'product-1',
    slug: 'linen-shirt',
    name: 'پیراهن لینن',
    audience: 'women',
    category: 'پیراهن',
    price: 1_200_000,
    compareAt: 1_500_000,
    image: '/media/linen.webp',
    alt: 'پیراهن لینن',
    colors: ['#d9c8ad'],
    tag: 'پیشنهاد ویژه',
    stock: 'موجود',
    available: true,
    categories: [
      { id: 'women', slug: 'women', name: 'زنانه' },
      { id: 'shirts', slug: 'shirts', name: 'پیراهن' },
    ],
    options: [],
    variants: [],
  });
});

test('does not present a malformed compare-at price as a storefront sale', () => {
  const product = toStorefrontProduct({
    id: 'product-2',
    slug: 'invalid-sale',
    name: 'محصول بدون تخفیف معتبر',
    priceToman: 1_200_000,
    compareAtPriceToman: 1_100_000,
    available: true,
    imageUrl: null,
    imageAlt: null,
    categories: [{ id: 'women', slug: 'women', name: 'زنانه' }],
    options: [],
    variants: [],
    colors: [],
    stockStatus: 'IN_STOCK',
  });

  assert.equal(product.compareAt, null);
  assert.equal(product.tag, undefined);
});

test('marks a product with a valid variant-only sale without inventing a product price', () => {
  const product = toStorefrontProduct({
    id: 'product-3',
    slug: 'variant-sale',
    name: 'محصول با تخفیف تنوع',
    priceToman: 1_200_000,
    compareAtPriceToman: null,
    available: true,
    imageUrl: null,
    imageAlt: null,
    categories: [{ id: 'women', slug: 'women', name: 'زنانه' }],
    options: [],
    variants: [
      {
        id: 'variant-3',
        sku: 'NOVA-VARIANT-003',
        title: null,
        size: null,
        color: null,
        colorHex: null,
        priceToman: 1_000_000,
        compareAtPriceToman: 1_200_000,
        optionValueIds: [],
        media: [],
        available: true,
      },
    ],
    colors: [],
    stockStatus: 'IN_STOCK',
  });

  assert.equal(product.compareAt, null);
  assert.equal(product.tag, 'پیشنهاد ویژه');
});

test('does not infer a product sale from a variant without effective compare-at metadata', () => {
  const product = toStorefrontProduct({
    id: 'product-4',
    slug: 'variant-without-sale',
    name: 'محصول بدون تخفیف تنوع',
    priceToman: 1_200_000,
    compareAtPriceToman: 1_100_000,
    available: true,
    imageUrl: null,
    imageAlt: null,
    categories: [{ id: 'women', slug: 'women', name: 'زنانه' }],
    options: [],
    variants: [
      {
        id: 'variant-4',
        sku: 'NOVA-VARIANT-004',
        title: null,
        size: null,
        color: null,
        colorHex: null,
        priceToman: 1_000_000,
        compareAtPriceToman: null,
        optionValueIds: [],
        media: [],
        available: true,
      },
    ],
    colors: [],
    stockStatus: 'IN_STOCK',
  });

  assert.equal(product.tag, undefined);
});
