import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { CatalogAdminService } from './catalog-admin.service';
import { CreateAdminProductDto, UpdateAdminProductDto } from './dto/admin-product.dto';
import type { CatalogProductStatus } from './dto/product-status.dto';

interface FakeProduct {
  id: string;
  slug: string;
  name: string;
  searchText: string;
  shortDescription: string | null;
  description: string | null;
  brand: string | null;
  basePriceToman: number;
  compareAtPriceToman: number | null;
  status: CatalogProductStatus;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FakeVariantPrice {
  priceToman: number | null;
  compareAtPriceToman: number | null;
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
    createdAt: new Date(product.createdAt),
    updatedAt: new Date(product.updatedAt),
  };
}

function createProduct(overrides: Partial<FakeProduct> = {}): FakeProduct {
  return {
    id: 'product-1',
    slug: 'linen-overshirt',
    name: 'مانتوی لینن کمربندی آوا',
    searchText: 'linen-overshirt مانتوی لینن کمربندی آوا',
    shortDescription: 'لایه‌ای سبک برای روزهای گرم.',
    description: 'پارچه لینن سبک.',
    brand: 'NOVA',
    basePriceToman: 2_490_000,
    compareAtPriceToman: 2_890_000,
    status: 'DRAFT',
    publishedAt: null,
    archivedAt: null,
    createdAt: new Date('2026-09-07T08:00:00.000Z'),
    updatedAt: new Date('2026-09-08T08:00:00.000Z'),
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
  initial = createProduct(),
  forcedUpdateCount?: number,
  variantPrices: FakeVariantPrice[] = [],
) {
  const products = [cloneProduct(initial)];
  const audits: AuditRecord[] = [];
  const createCalls: Array<Record<string, unknown>> = [];
  let updateCalls = 0;

  const transaction = {
    product: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createCalls.push(data);
        const created = createProduct({
          id: 'product-2',
          slug: data.slug as string,
          name: data.name as string,
          searchText: data.searchText as string,
          shortDescription: data.shortDescription as string | null,
          description: data.description as string | null,
          brand: data.brand as string | null,
          basePriceToman: data.basePriceToman as number,
          compareAtPriceToman: data.compareAtPriceToman as number | null,
          status: data.status as CatalogProductStatus,
          publishedAt: data.publishedAt as Date | null,
          archivedAt: data.archivedAt as Date | null,
          createdAt: new Date('2026-09-08T09:00:00.000Z'),
          updatedAt: new Date('2026-09-08T09:00:00.000Z'),
        });
        products.push(created);
        return cloneProduct(created);
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const product = products.find((candidate) => candidate.id === where.id);
        return product ? cloneProduct(product) : null;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; updatedAt: Date };
        data: Record<string, unknown>;
      }) => {
        updateCalls += 1;
        if (forcedUpdateCount !== undefined) return { count: forcedUpdateCount };

        const product = products.find((candidate) => candidate.id === where.id);
        if (!product || product.updatedAt.getTime() !== where.updatedAt.getTime()) {
          return { count: 0 };
        }

        Object.assign(product, data, { updatedAt: new Date('2026-09-08T09:30:00.000Z') });
        return { count: 1 };
      },
    },
    productVariant: {
      findMany: async () => variantPrices.map((variant) => ({ ...variant })),
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
    $transaction: async <T>(callback: (value: typeof transaction) => Promise<T>): Promise<T> =>
      callback(transaction),
  };
  const audit = new AuditService({ prisma } as never);
  const service = new CatalogAdminService({ prisma } as never, audit);

  return {
    service,
    products,
    audits,
    createCalls,
    getUpdateCalls: () => updateCalls,
  };
}

test('creates a draft product with normalized text and an audit event', async () => {
  const { service, products, audits, createCalls } = createService();
  const input = Object.assign(new CreateAdminProductDto(), {
    slug: '  WOOL-COAT  ',
    name: '  پالتوی  پشمی  ',
    shortDescription: '  لایه‌ای گرم  ',
    description: null,
    brand: '  NOVA  ',
    basePriceToman: 4_200_000,
    compareAtPriceToman: null,
  });

  const result = await service.createProduct(createAdmin(), input);

  assert.equal(result.id, 'product-2');
  assert.equal(result.slug, 'wool-coat');
  assert.equal(result.name, 'پالتوی پشمی');
  assert.equal(result.status, 'DRAFT');
  assert.equal(result.description, null);
  assert.equal(result.publishedAt, null);
  assert.equal(result.archivedAt, null);
  assert.equal(products[1]?.searchText, 'wool-coat پالتوی پشمی لایه ای گرم nova');
  assert.equal(createCalls[0]?.status, 'DRAFT');
  assert.deepEqual(audits[0], {
    actorType: 'STAFF',
    actorUserId: 'staff-1',
    action: 'catalog.product.created',
    resourceType: 'Product',
    resourceId: 'product-2',
    metadata: { productSlug: 'wool-coat', status: 'DRAFT' },
  });
});

test('updates product fields, rebuilds search text, and records changed fields', async () => {
  const { service, products, audits } = createService();
  const input = Object.assign(new UpdateAdminProductDto(), {
    name: '  کت پشمی جدید  ',
    shortDescription: null,
    description: '  توضیحات تازه  ',
    brand: '  آتلیه نووا  ',
    basePriceToman: 2_700_000,
  });

  const result = await service.updateProduct(createAdmin(), 'product-1', input);

  assert.equal(result.name, 'کت پشمی جدید');
  assert.equal(result.shortDescription, null);
  assert.equal(result.description, 'توضیحات تازه');
  assert.equal(result.brand, 'آتلیه نووا');
  assert.equal(result.basePriceToman, 2_700_000);
  assert.equal(products[0]?.searchText, 'linen-overshirt کت پشمی جدید توضیحات تازه آتلیه نووا');
  assert.deepEqual(audits[0]?.metadata, {
    productSlug: 'linen-overshirt',
    changedFields: ['name', 'shortDescription', 'description', 'brand', 'basePriceToman'],
  });
});

test('treats an update with identical values as a no-op without an audit', async () => {
  const { service, audits, getUpdateCalls } = createService();
  const input = Object.assign(new UpdateAdminProductDto(), {
    name: 'مانتوی لینن کمربندی آوا',
    basePriceToman: 2_490_000,
  });

  const result = await service.updateProduct(createAdmin(), 'product-1', input);

  assert.equal(result.id, 'product-1');
  assert.equal(audits.length, 0);
  assert.equal(getUpdateCalls(), 0);
});

test('rejects a lost product update without writing an audit', async () => {
  const { service, audits } = createService(createProduct(), 0);
  const input = Object.assign(new UpdateAdminProductDto(), { name: 'نام هم‌زمان تغییرکرده' });

  await assert.rejects(
    service.updateProduct(createAdmin(), 'product-1', input),
    (error: unknown) =>
      error instanceof ConflictException &&
      (error.getResponse() as { code?: string }).code === 'PRODUCT_UPDATE_CONFLICT',
  );
  assert.equal(audits.length, 0);
});

test('keeps product writes admin-only and validates service inputs', async () => {
  const { service, audits } = createService();
  const support: AuthenticatedStaff = { ...createAdmin(), roles: ['support'] };
  const invalid = Object.assign(new CreateAdminProductDto(), {
    slug: 'bad slug',
    name: 'نام',
    basePriceToman: -1,
  });

  await assert.rejects(
    service.createProduct(support, invalid),
    (error: unknown) => error instanceof ForbiddenException,
  );
  await assert.rejects(
    service.createProduct(createAdmin(), invalid),
    (error: unknown) => error instanceof BadRequestException,
  );
  assert.equal(audits.length, 0);
});

test('rejects product compare-at prices that are not above the active price', async () => {
  const { service, audits, createCalls, getUpdateCalls } = createService();
  const invalidCreate = Object.assign(new CreateAdminProductDto(), {
    slug: 'invalid-sale',
    name: 'محصول بدون تخفیف معتبر',
    basePriceToman: 1_200_000,
    compareAtPriceToman: 1_200_000,
  });

  await assert.rejects(
    service.createProduct(createAdmin(), invalidCreate),
    (error: unknown) => error instanceof BadRequestException,
  );

  const invalidUpdate = Object.assign(new UpdateAdminProductDto(), {
    compareAtPriceToman: 2_000_000,
  });
  await assert.rejects(
    service.updateProduct(createAdmin(), 'product-1', invalidUpdate),
    (error: unknown) => error instanceof BadRequestException,
  );

  assert.equal(createCalls.length, 0);
  assert.equal(getUpdateCalls(), 0);
  assert.equal(audits.length, 0);
});

test('rejects a product price change that would invalidate an inherited variant sale', async () => {
  const { service, audits, getUpdateCalls } = createService(
    createProduct({ basePriceToman: 100_000, compareAtPriceToman: 200_000 }),
    undefined,
    [{ priceToman: null, compareAtPriceToman: 150_000 }],
  );
  const input = Object.assign(new UpdateAdminProductDto(), { basePriceToman: 160_000 });

  await assert.rejects(
    service.updateProduct(createAdmin(), 'product-1', input),
    (error: unknown) => error instanceof BadRequestException && error.message.includes('تنوع'),
  );
  assert.equal(getUpdateCalls(), 0);
  assert.equal(audits.length, 0);
});
