import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ConflictException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { AuditService } from '../audit/audit.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { CatalogAdminService } from './catalog-admin.service';
import { AdminProductListQueryDto } from './dto/admin-product-list.query';
import type { CatalogProductStatus } from './dto/product-status.dto';

interface FakeProduct {
  id: string;
  slug: string;
  name: string;
  basePriceToman: number;
  compareAtPriceToman: number | null;
  status: CatalogProductStatus;
  publishedAt: Date | null;
  archivedAt: Date | null;
  categories: Array<{ id: string; slug: string; name: string }>;
  variants: Array<{
    id: string;
    isActive: boolean;
    inventory: { onHand: number; reserved: number; reorderPoint: number } | null;
  }>;
  media: Array<{ id: string; kind: 'PRODUCT' | 'DETAIL'; url: string; altText: string }>;
}

interface AuditRecord {
  actorType: string;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata?: unknown;
}

function cloneProduct(product: FakeProduct): FakeProduct {
  return {
    ...product,
    publishedAt: product.publishedAt ? new Date(product.publishedAt) : null,
    archivedAt: product.archivedAt ? new Date(product.archivedAt) : null,
    categories: product.categories.map((category) => ({ ...category })),
    variants: product.variants.map((variant) => ({
      ...variant,
      inventory: variant.inventory ? { ...variant.inventory } : null,
    })),
    media: product.media.map((media) => ({ ...media })),
  };
}

function createProduct(overrides: Partial<FakeProduct> = {}): FakeProduct {
  return {
    id: 'product-1',
    slug: 'linen-overshirt',
    name: 'مانتوی لینن کمربندی آوا',
    basePriceToman: 2_490_000,
    compareAtPriceToman: 2_890_000,
    status: 'DRAFT',
    publishedAt: null,
    archivedAt: null,
    categories: [{ id: 'category-1', slug: 'outerwear', name: 'مانتو' }],
    variants: [
      {
        id: 'variant-1',
        isActive: true,
        inventory: { onHand: 8, reserved: 2, reorderPoint: 3 },
      },
    ],
    media: [
      {
        id: 'media-1',
        kind: 'PRODUCT',
        url: '/assets/nova-product-linen-overshirt.webp',
        altText: 'مانتوی لینن روشن',
      },
    ],
    ...overrides,
  };
}

function createAdmin(): AuthenticatedStaff {
  return {
    id: 'staff-1',
    email: 'admin@nova.test',
    status: 'ACTIVE',
    roles: ['admin'],
  };
}

function createService(
  initial: FakeProduct,
  forcedUpdateCount?: number,
  lowStockProductIds: string[] = [],
) {
  const state = cloneProduct(initial);
  const audits: AuditRecord[] = [];
  let updateCalls = 0;

  const matchesProductWhere = (where: {
    id?: { in?: string[] };
    status?: CatalogProductStatus;
    categories?: { some?: { category?: { slug?: string } } };
  }) => {
    if (where.id?.in && !where.id.in.includes(state.id)) return false;
    if (where.status && where.status !== state.status) return false;
    const categorySlug = where.categories?.some?.category?.slug;
    if (categorySlug && !state.categories.some((category) => category.slug === categorySlug)) {
      return false;
    }
    return true;
  };

  const transaction = {
    product: {
      count: async ({
        where,
      }: {
        where: {
          id?: { in?: string[] };
          status?: CatalogProductStatus;
          categories?: { some?: { category?: { slug?: string } } };
        };
      }) => (matchesProductWhere(where) ? 1 : 0),
      findMany: async ({
        where,
      }: {
        where: {
          id?: { in?: string[] };
          status?: CatalogProductStatus;
          categories?: { some?: { category?: { slug?: string } } };
        };
        skip: number;
        take: number;
      }) => {
        if (!matchesProductWhere(where)) return [];
        return [
          {
            id: state.id,
            slug: state.slug,
            name: state.name,
            basePriceToman: state.basePriceToman,
            compareAtPriceToman: state.compareAtPriceToman,
            status: state.status,
            publishedAt: state.publishedAt,
            archivedAt: state.archivedAt,
            createdAt: new Date('2026-09-07T08:00:00.000Z'),
            updatedAt: new Date('2026-09-08T08:00:00.000Z'),
            categories: state.categories.map((category) => ({ category })),
            media: state.media
              .filter((media) => media.kind === 'PRODUCT')
              .map(({ url, altText }) => ({ url, altText })),
            variants: state.variants
              .filter((variant) => variant.isActive)
              .map(({ inventory }) => ({ inventory })),
            _count: { variants: state.variants.length, media: state.media.length },
          },
        ];
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (where.id !== state.id) return null;
        return {
          id: state.id,
          slug: state.slug,
          name: state.name,
          status: state.status,
          publishedAt: state.publishedAt,
          archivedAt: state.archivedAt,
          variants: state.variants.filter((variant) => variant.isActive).map(({ id }) => ({ id })),
          media: state.media.filter((media) => media.kind === 'PRODUCT').map(({ id }) => ({ id })),
        };
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; status: CatalogProductStatus };
        data: {
          status: CatalogProductStatus;
          publishedAt?: Date | null;
          archivedAt?: Date | null;
        };
      }) => {
        updateCalls += 1;
        if (forcedUpdateCount !== undefined) return { count: forcedUpdateCount };
        if (where.id !== state.id || where.status !== state.status) return { count: 0 };
        state.status = data.status;
        if ('publishedAt' in data) state.publishedAt = data.publishedAt ?? null;
        if ('archivedAt' in data) state.archivedAt = data.archivedAt ?? null;
        return { count: 1 };
      },
    },
    auditEvent: {
      create: async ({ data }: { data: AuditRecord }) => {
        audits.push(data);
        return { id: `audit-${audits.length}` };
      },
    },
  };

  const prisma = {
    ...transaction,
    $queryRaw: async () => lowStockProductIds.map((id) => ({ id })),
    $transaction: async <T>(callback: (value: typeof transaction) => Promise<T>): Promise<T> =>
      callback(transaction),
  };
  const audit = new AuditService({ prisma } as never);
  const service = new CatalogAdminService({ prisma } as never, audit);

  return { service, state, audits, getUpdateCalls: () => updateCalls };
}

test('publishes a valid product and records the audit in the transaction', async () => {
  const { service, state, audits } = createService(createProduct());

  const result = await service.updateProductStatus(createAdmin(), state.id, 'PUBLISHED');

  assert.equal(result.status, 'PUBLISHED');
  assert.ok(result.publishedAt instanceof Date);
  assert.equal(result.archivedAt, null);
  assert.equal(audits.length, 1);
  assert.deepEqual(audits[0], {
    actorType: 'STAFF',
    actorUserId: 'staff-1',
    action: 'catalog.product.status_changed',
    resourceType: 'Product',
    resourceId: 'product-1',
    metadata: {
      productSlug: 'linen-overshirt',
      fromStatus: 'DRAFT',
      toStatus: 'PUBLISHED',
    },
  });
});

test('lists lifecycle metadata for support staff without exposing mutation access', async () => {
  const { service } = createService(createProduct({ status: 'PUBLISHED' }));
  const support: AuthenticatedStaff = { ...createAdmin(), roles: ['support'] };
  const query = Object.assign(new AdminProductListQueryDto(), {
    status: 'PUBLISHED',
    page: 1,
    limit: 10,
  });

  const result = await service.listProducts(support, query);

  assert.equal(result.total, 1);
  assert.equal(result.items[0]?.status, 'PUBLISHED');
  assert.equal(result.items[0]?.basePriceToman, 2_490_000);
  assert.equal(result.items[0]?.compareAtPriceToman, 2_890_000);
  assert.deepEqual(result.items[0]?.categories, [
    { id: 'category-1', slug: 'outerwear', name: 'مانتو' },
  ]);
  assert.deepEqual(result.items[0]?.primaryMedia, {
    url: '/assets/nova-product-linen-overshirt.webp',
    altText: 'مانتوی لینن روشن',
  });
  assert.deepEqual(result.items[0]?.inventory, {
    available: 6,
    lowStockVariantCount: 0,
    outOfStockVariantCount: 0,
    status: 'IN_STOCK',
  });
  assert.equal(result.items[0]?.variantCount, 1);
  assert.equal(result.items[0]?.mediaCount, 1);
  assert.equal(result.items[0]?.createdAt.toISOString(), '2026-09-07T08:00:00.000Z');
});

test('normalizes and validates admin catalog filters', async () => {
  const dto = plainToInstance(AdminProductListQueryDto, {
    limit: '12',
    page: '2',
    q: '  ي‌كت  ',
    status: 'PUBLISHED',
    category: 'outerwear',
    lowStock: 'true',
  });

  assert.equal((await validate(dto)).length, 0);
  assert.equal(dto.limit, 12);
  assert.equal(dto.page, 2);
  assert.equal(dto.q, 'ی کت');
  assert.equal(dto.status, 'PUBLISHED');
  assert.equal(dto.category, 'outerwear');
  assert.equal(dto.lowStock, true);

  const invalid = plainToInstance(AdminProductListQueryDto, {
    category: 'outer wear',
    lowStock: 'maybe',
  });
  const errors = await validate(invalid);

  assert.ok(errors.some((error) => error.property === 'category'));
  assert.ok(errors.some((error) => error.property === 'lowStock'));
});

test('applies the active category filter before pagination', async () => {
  const { service } = createService(createProduct());
  const query = Object.assign(new AdminProductListQueryDto(), {
    category: 'outerwear',
    page: 1,
    limit: 10,
  });

  const result = await service.listProducts(createAdmin(), query);

  assert.equal(result.total, 1);
  assert.equal(result.items[0]?.id, 'product-1');

  const excludedQuery = Object.assign(new AdminProductListQueryDto(), {
    category: 'footwear',
    page: 1,
    limit: 10,
  });
  const excluded = await service.listProducts(createAdmin(), excludedQuery);

  assert.equal(excluded.total, 0);
  assert.deepEqual(excluded.items, []);
});

test('supports the exact low-stock filter before applying pagination', async () => {
  const { service } = createService(createProduct(), undefined, ['product-1']);
  const query = Object.assign(new AdminProductListQueryDto(), {
    lowStock: true,
    page: 1,
    limit: 10,
  });

  const result = await service.listProducts(createAdmin(), query);

  assert.equal(result.total, 1);
  assert.equal(result.items[0]?.id, 'product-1');

  const { service: excludedService } = createService(createProduct(), undefined, []);
  const excluded = await excludedService.listProducts(createAdmin(), query);

  assert.equal(excluded.total, 0);
  assert.deepEqual(excluded.items, []);
});

test('blocks publishing without an active variant or primary media', async () => {
  const noVariant = createService(
    createProduct({
      variants: [{ id: 'variant-1', isActive: false, inventory: null }],
    }),
  );
  await assert.rejects(
    noVariant.service.updateProductStatus(createAdmin(), 'product-1', 'PUBLISHED'),
    (error: unknown) =>
      error instanceof ConflictException &&
      (error.getResponse() as { code?: string }).code === 'PRODUCT_PUBLISH_BLOCKED',
  );
  assert.equal(noVariant.state.status, 'DRAFT');
  assert.equal(noVariant.audits.length, 0);

  const noMedia = createService(
    createProduct({
      media: [
        {
          id: 'media-1',
          kind: 'DETAIL',
          url: '/assets/detail.webp',
          altText: 'جزئیات محصول',
        },
      ],
    }),
  );
  await assert.rejects(
    noMedia.service.updateProductStatus(createAdmin(), 'product-1', 'PUBLISHED'),
    (error: unknown) =>
      error instanceof ConflictException &&
      (error.getResponse() as { code?: string }).code === 'PRODUCT_PUBLISH_BLOCKED',
  );
  assert.equal(noMedia.state.status, 'DRAFT');
  assert.equal(noMedia.audits.length, 0);
});

test('archives safely, restores to draft, and does not delete the product', async () => {
  const publishedAt = new Date('2026-09-08T08:00:00.000Z');
  const { service, state, audits } = createService(
    createProduct({ status: 'PUBLISHED', publishedAt }),
  );

  const archived = await service.updateProductStatus(createAdmin(), state.id, 'ARCHIVED');
  assert.equal(archived.status, 'ARCHIVED');
  assert.equal(archived.publishedAt?.toISOString(), publishedAt.toISOString());
  assert.ok(archived.archivedAt instanceof Date);

  const draft = await service.updateProductStatus(createAdmin(), state.id, 'DRAFT');
  assert.equal(draft.status, 'DRAFT');
  assert.equal(draft.publishedAt, null);
  assert.equal(draft.archivedAt, null);
  assert.equal(state.id, 'product-1');
  assert.equal(audits.length, 2);
});

test('treats the current status as an idempotent no-op and rejects invalid transitions', async () => {
  const publishedAt = new Date('2026-09-08T08:00:00.000Z');
  const sameStatus = createService(createProduct({ status: 'PUBLISHED', publishedAt }));
  const result = await sameStatus.service.updateProductStatus(
    createAdmin(),
    sameStatus.state.id,
    'PUBLISHED',
  );
  assert.equal(result.publishedAt?.toISOString(), publishedAt.toISOString());
  assert.equal(sameStatus.audits.length, 0);
  assert.equal(sameStatus.getUpdateCalls(), 0);

  const archived = createService(createProduct({ status: 'ARCHIVED' }));
  await assert.rejects(
    archived.service.updateProductStatus(createAdmin(), archived.state.id, 'PUBLISHED'),
    (error: unknown) =>
      error instanceof ConflictException &&
      (error.getResponse() as { code?: string }).code === 'PRODUCT_STATUS_TRANSITION_INVALID',
  );
  assert.equal(archived.audits.length, 0);
});

test('enforces the admin role inside the catalog use case', async () => {
  const { service, audits, getUpdateCalls } = createService(createProduct());
  const support: AuthenticatedStaff = { ...createAdmin(), roles: ['support'] };

  await assert.rejects(
    service.updateProductStatus(support, 'product-1', 'PUBLISHED'),
    (error: unknown) => error instanceof ForbiddenException,
  );
  assert.equal(audits.length, 0);
  assert.equal(getUpdateCalls(), 0);
});

test('rejects a lost optimistic-concurrency update without writing an audit', async () => {
  const { service, state, audits } = createService(createProduct(), 0);

  await assert.rejects(
    service.updateProductStatus(createAdmin(), state.id, 'PUBLISHED'),
    (error: unknown) =>
      error instanceof ConflictException &&
      (error.getResponse() as { code?: string }).code === 'PRODUCT_STATUS_CONFLICT',
  );
  assert.equal(audits.length, 0);
});
