import assert from 'node:assert/strict';
import { test } from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CatalogService } from './catalog.service';
import type { CatalogMediaReadUrlInput, CatalogMediaStorage } from './catalog-media.storage';
import { CatalogFacetQueryDto } from './dto/catalog-facet.query';
import { normalizeSearchText, ProductListQueryDto } from './dto/product-list.query';
import { SearchSuggestionsQueryDto } from './dto/search-suggestions.query';

function createService(product: Record<string, unknown>, ids = ['product-1']): CatalogService {
  const prisma = {
    $queryRaw: async () => [{ ids, total: ids.length }],
    product: {
      findMany: async () => [product],
      findFirst: async () => product,
    },
  };

  return new CatalogService({ prisma } as never);
}

function createSuggestionService(rows: unknown[], onQuery?: () => void): CatalogService {
  const prisma = {
    $queryRaw: async () => {
      onQuery?.();
      return rows;
    },
  };

  return new CatalogService({ prisma } as never);
}

function createMediaService(
  media: Record<string, unknown>,
  onReadUrl: (input: CatalogMediaReadUrlInput) => Promise<string>,
): CatalogService {
  const prisma = {
    productMedia: {
      findUnique: async () => media,
    },
  };
  const storage = { createDerivativeReadUrl: onReadUrl } as unknown as CatalogMediaStorage;

  return new CatalogService({ prisma } as never, storage);
}

function createProduct(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'product-1',
    slug: 'linen-overshirt',
    name: 'مانتوی لینن کمربندی آوا',
    shortDescription: 'لایه‌ای سبک برای روزهای گرم.',
    description: 'پارچه لینن سبک.',
    brand: null,
    basePriceToman: 2_490_000,
    compareAtPriceToman: 2_890_000,
    variants: [
      {
        id: 'variant-1',
        sku: 'NOVA-LINEN-001-M',
        title: 'کرم / M',
        size: 'M',
        color: 'کرم',
        colorHex: '#d9c8ad',
        priceToman: 2_490_000,
        compareAtPriceToman: 2_890_000,
        optionValues: [{ optionValueId: 'color-cream' }],
        media: [],
        inventory: { onHand: 3, reserved: 0, reorderPoint: 4 },
      },
      {
        id: 'variant-2',
        sku: 'NOVA-LINEN-001-L',
        title: 'کرم / L',
        size: 'L',
        color: 'کرم',
        colorHex: '#d9c8ad',
        priceToman: 2_490_000,
        compareAtPriceToman: 2_890_000,
        optionValues: [],
        media: [],
        inventory: { onHand: 0, reserved: 0, reorderPoint: 4 },
      },
    ],
    categories: [
      { id: 'women', slug: 'women', name: 'زنانه' },
      { id: 'outerwear', slug: 'outerwear', name: 'مانتو و رویه' },
    ],
    options: [
      {
        id: 'option-color',
        key: 'color',
        name: 'رنگ',
        sortOrder: 0,
        values: [{ id: 'color-cream', key: 'کرم', label: 'کرم', sortOrder: 0 }],
      },
    ],
    media: [{ url: '/assets/nova-product-linen-overshirt.webp', altText: 'مانتوی لینن روشن' }],
    attributes: [{ key: 'material', value: 'لینن' }],
    ...overrides,
  };
}

test('normalizes Persian character variants and preserves word boundaries', () => {
  assert.equal(normalizeSearchText('  ي‌ك  مانتو، XL / ۱۲۳  '), 'ی ک مانتو xl 123');
});

test('transforms and validates catalog query parameters', async () => {
  const dto = plainToInstance(ProductListQueryDto, {
    limit: '12',
    page: '2',
    q: '  ي‌کت  ',
    minPrice: '1000',
    inStock: 'false',
  });

  assert.equal((await validate(dto)).length, 0);
  assert.equal(dto.limit, 12);
  assert.equal(dto.page, 2);
  assert.equal(dto.q, 'ی کت');
  assert.equal(dto.minPrice, 1000);
  assert.equal(dto.inStock, false);

  const invalid = plainToInstance(ProductListQueryDto, { limit: '0', inStock: '1' });
  const errors = await validate(invalid);
  assert.ok(errors.some((error) => error.property === 'limit'));
  assert.ok(errors.some((error) => error.property === 'inStock'));
});

test('transforms and validates catalog facet query parameters', async () => {
  const dto = plainToInstance(CatalogFacetQueryDto, {
    q: '  ي‌كت  ',
    audience: 'women',
    size: ' XL ',
    minPrice: '1000',
    inStock: 'false',
  });

  assert.equal((await validate(dto)).length, 0);
  assert.equal(dto.q, 'ی کت');
  assert.equal(dto.size, 'xl');
  assert.equal(dto.minPrice, 1000);
  assert.equal(dto.inStock, false);

  const invalid = plainToInstance(CatalogFacetQueryDto, { audience: 'all', inStock: '1' });
  const errors = await validate(invalid);
  assert.ok(errors.some((error) => error.property === 'audience'));
  assert.ok(errors.some((error) => error.property === 'inStock'));
});

test('normalizes and bounds search suggestion query parameters', async () => {
  const dto = plainToInstance(SearchSuggestionsQueryDto, {
    q: '  ي‌كت  ',
    limit: '10',
  });

  assert.equal((await validate(dto)).length, 0);
  assert.equal(dto.q, 'ی کت');
  assert.equal(dto.limit, 10);

  const invalid = plainToInstance(SearchSuggestionsQueryDto, { limit: '11' });
  const errors = await validate(invalid);
  assert.ok(errors.some((error) => error.property === 'limit'));
});

test('returns inventory-aware safe catalog metadata without inventory internals', async () => {
  const response = await createService(createProduct()).listProducts(
    Object.assign(new ProductListQueryDto(), { page: 1, limit: 24 }),
  );

  assert.equal(response.total, 1);
  assert.equal(response.items[0]?.available, true);
  assert.equal(response.items[0]?.stockStatus, 'LOW_STOCK');
  assert.equal(response.items[0]?.compareAtPriceToman, 2_890_000);
  assert.deepEqual(response.items[0]?.colors, [{ name: 'کرم', hex: '#d9c8ad' }]);
  assert.deepEqual(response.items[0]?.options[0]?.values, [
    { id: 'color-cream', key: 'کرم', label: 'کرم', sortOrder: 0 },
  ]);
  assert.deepEqual(response.items[0]?.variants[0]?.optionValueIds, ['color-cream']);
  assert.equal(Object.hasOwn(response.items[0]?.variants[0] ?? {}, 'onHand'), false);
  assert.equal(Object.hasOwn(response.items[0]?.variants[0] ?? {}, 'reserved'), false);
});

test('does not expose malformed product or variant sale metadata', async () => {
  const defaultProduct = createProduct();
  const defaultVariants = defaultProduct.variants as Array<Record<string, unknown>>;
  const product = createProduct({
    compareAtPriceToman: 2_000_000,
    variants: [
      {
        ...defaultVariants[0],
        compareAtPriceToman: 2_000_000,
      },
    ],
  });
  const response = await createService(product).listProducts(
    Object.assign(new ProductListQueryDto(), { page: 1, limit: 24 }),
  );

  assert.equal(response.items[0]?.compareAtPriceToman, null);
  assert.equal(response.items[0]?.variants[0]?.compareAtPriceToman, null);

  const inheritedSaleProduct = createProduct({
    variants: [
      {
        ...defaultVariants[0],
        compareAtPriceToman: null,
      },
    ],
  });
  const inheritedSaleResponse = await createService(inheritedSaleProduct).listProducts(
    Object.assign(new ProductListQueryDto(), { page: 1, limit: 24 }),
  );
  assert.equal(inheritedSaleResponse.items[0]?.variants[0]?.compareAtPriceToman, 2_890_000);

  const invalidInheritedSaleProduct = createProduct({
    compareAtPriceToman: 2_700_000,
    variants: [
      {
        ...defaultVariants[0],
        priceToman: 2_800_000,
        compareAtPriceToman: null,
      },
    ],
  });
  const invalidInheritedSaleResponse = await createService(
    invalidInheritedSaleProduct,
  ).listProducts(Object.assign(new ProductListQueryDto(), { page: 1, limit: 24 }));
  assert.equal(invalidInheritedSaleResponse.items[0]?.variants[0]?.compareAtPriceToman, null);
});

test('rejects an inverted price range before querying the database', async () => {
  const service = createService(createProduct());
  const query = Object.assign(new ProductListQueryDto(), { minPrice: 2_000, maxPrice: 1_000 });

  await assert.rejects(service.listProducts(query), /حداقل قیمت/);
});

test('returns bounded product-count facets and preserves selected values', async () => {
  const service = createSuggestionService([
    { key: 'size', value: 'S', label: 'S', count: 4, selected: false, hex: null },
    { key: 'size', value: 'M', label: 'M', count: 3, selected: true, hex: null },
    { key: 'color', value: 'کرم', label: 'کرم', count: 2, selected: false, hex: '#d9c8ad' },
    { key: 'material', value: 'لینن', label: 'لینن', count: 2, selected: false, hex: null },
  ]);

  const response = await service.listFacets(
    Object.assign(new CatalogFacetQueryDto(), {
      audience: 'women',
      size: 'M',
      color: 'مشکی',
      material: 'لینن',
    }),
  );

  assert.deepEqual(
    response.groups.map((group) => group.key),
    ['size', 'color', 'material'],
  );
  assert.deepEqual(
    response.groups[0]?.options.find((option) => option.value === 'M'),
    {
      value: 'M',
      label: 'M',
      count: 3,
      selected: true,
    },
  );
  assert.deepEqual(
    response.groups[1]?.options.find((option) => option.value === 'کرم'),
    {
      value: 'کرم',
      label: 'کرم',
      count: 2,
      selected: false,
      hex: '#d9c8ad',
    },
  );
  assert.deepEqual(
    response.groups[1]?.options.find((option) => option.value === 'مشکی'),
    {
      value: 'مشکی',
      label: 'مشکی',
      count: 0,
      selected: true,
      hex: null,
    },
  );
  assert.equal(
    response.groups[2]?.options.find((option) => option.value === 'لینن')?.selected,
    true,
  );
});

test('rejects an inverted facet price range before querying', async () => {
  let queried = false;
  const service = createSuggestionService([], () => {
    queried = true;
  });

  await assert.rejects(
    service.listFacets(
      Object.assign(new CatalogFacetQueryDto(), { minPrice: 2_000, maxPrice: 1_000 }),
    ),
    /حداقل قیمت/,
  );
  assert.equal(queried, false);
});

test('returns safe typed product and category suggestions from the public catalog boundary', async () => {
  const service = createSuggestionService([
    {
      type: 'CATEGORY',
      id: 'category-1',
      slug: 'outerwear',
      label: 'مانتو و رویه',
      imageUrl: null,
      imageAlt: null,
      score: 1,
    },
    {
      type: 'PRODUCT',
      id: 'product-1',
      slug: 'linen-overshirt',
      label: 'مانتوی لینن کمربندی آوا',
      imageUrl: '/media/linen.webp',
      imageAlt: 'مانتوی لینن',
      score: 1,
    },
  ]);

  const response = await service.listSearchSuggestions(
    Object.assign(new SearchSuggestionsQueryDto(), { q: 'ي‌كت', limit: 8 }),
  );

  assert.deepEqual(response, [
    {
      type: 'CATEGORY',
      id: 'category-1',
      slug: 'outerwear',
      label: 'مانتو و رویه',
      imageUrl: null,
      imageAlt: null,
    },
    {
      type: 'PRODUCT',
      id: 'product-1',
      slug: 'linen-overshirt',
      label: 'مانتوی لینن کمربندی آوا',
      imageUrl: '/media/linen.webp',
      imageAlt: 'مانتوی لینن',
    },
  ]);
});

test('does not query the database for a blank suggestion query', async () => {
  let queried = false;
  const service = createSuggestionService([], () => {
    queried = true;
  });

  const response = await service.listSearchSuggestions(new SearchSuggestionsQueryDto());

  assert.deepEqual(response, []);
  assert.equal(queried, false);
});

test('uses the persisted asset key when creating a public derivative URL', async () => {
  const calls: CatalogMediaReadUrlInput[] = [];
  const service = createMediaService(
    {
      id: 'database-media-1',
      productId: 'product-1',
      storageStatus: 'READY',
      derivativeKey: 'catalog/products/product-1/asset-1/derivative.webp',
    },
    async (input) => {
      calls.push(input);
      return 'https://cdn.test/asset-1.webp';
    },
  );

  assert.equal(await service.getMediaUrl('database-media-1'), 'https://cdn.test/asset-1.webp');
  assert.deepEqual(calls, [
    {
      mediaId: 'asset-1',
      productId: 'product-1',
      derivativeKey: 'catalog/products/product-1/asset-1/derivative.webp',
    },
  ]);
});
