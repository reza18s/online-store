import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { CatalogAdminService } from './catalog-admin.service';
import {
  CreateAdminProductMediaDto,
  CreateAdminProductVariantDto,
  UpdateAdminProductMediaDto,
  UpdateAdminProductVariantDto,
} from './dto/admin-product.dto';
import type { CatalogProductStatus } from './dto/product-status.dto';

interface FakeVariant {
  id: string;
  productId: string;
  sku: string;
  title: string | null;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  priceToman: number | null;
  compareAtPriceToman: number | null;
  isActive: boolean;
  optionValues: Array<{ optionValueId: string }>;
  createdAt: Date;
  updatedAt: Date;
  inventory: { onHand: number; reserved: number; reorderPoint: number } | null;
}

interface FakeOptionValue {
  id: string;
  optionId: string;
  productId: string;
}

interface FakeMedia {
  id: string;
  productId: string;
  url: string;
  altText: string;
  kind: 'PRODUCT' | 'DETAIL' | 'SWATCH';
  sortOrder: number;
  width: number | null;
  height: number | null;
}

interface AuditRecord {
  actorType: string;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata?: unknown;
}

function cloneVariant(variant: FakeVariant): FakeVariant {
  return {
    ...variant,
    optionValues: variant.optionValues.map((optionValue) => ({ ...optionValue })),
    createdAt: new Date(variant.createdAt),
    updatedAt: new Date(variant.updatedAt),
    inventory: variant.inventory ? { ...variant.inventory } : null,
  };
}

function cloneMedia(media: FakeMedia): FakeMedia {
  return { ...media };
}

function createVariant(overrides: Partial<FakeVariant> = {}): FakeVariant {
  return {
    id: 'variant-1',
    productId: 'product-1',
    sku: 'NOVA-LINEN-001-M',
    title: 'کرم / M',
    size: 'M',
    color: 'کرم',
    colorHex: '#D9C8AD',
    priceToman: 2_490_000,
    compareAtPriceToman: 2_890_000,
    isActive: true,
    optionValues: [],
    createdAt: new Date('2026-09-07T08:00:00.000Z'),
    updatedAt: new Date('2026-09-08T08:00:00.000Z'),
    inventory: { onHand: 4, reserved: 0, reorderPoint: 2 },
    ...overrides,
  };
}

function createMedia(overrides: Partial<FakeMedia> = {}): FakeMedia {
  return {
    id: 'media-1',
    productId: 'product-1',
    url: '/assets/linen-front.webp',
    altText: 'نمای جلوی مانتوی لینن',
    kind: 'PRODUCT',
    sortOrder: 0,
    width: 1200,
    height: 1600,
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
  options: {
    productStatus?: CatalogProductStatus;
    productCompareAtPriceToman?: number | null;
    variants?: FakeVariant[];
    media?: FakeMedia[];
    optionValues?: FakeOptionValue[];
    forcedVariantUpdateCount?: number;
  } = {},
) {
  const product = {
    id: 'product-1',
    basePriceToman: 2_490_000,
    compareAtPriceToman: options.productCompareAtPriceToman ?? null,
    status: options.productStatus ?? 'DRAFT',
  };
  const variants = (options.variants ?? [createVariant()]).map(cloneVariant);
  const media = (options.media ?? [createMedia()]).map(cloneMedia);
  const optionValues = options.optionValues ?? [
    { id: 'color-cream', optionId: 'option-color', productId: product.id },
    { id: 'color-black', optionId: 'option-color', productId: product.id },
  ];
  const audits: AuditRecord[] = [];

  const transaction = {
    product: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        where.id === product.id ? { ...product } : null,
    },
    productVariant: {
      findMany: async () => variants.map(cloneVariant),
      findUnique: async ({ where }: { where: { id: string } }) => {
        const variant = variants.find((candidate) => candidate.id === where.id);
        return variant ? cloneVariant(variant) : null;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const optionValueCreate = data.optionValues as
          { create?: Array<{ optionValue: { connect: { id: string } } }> } | undefined;
        const variant = createVariant({
          id: 'variant-2',
          productId: product.id,
          sku: data.sku as string,
          title: data.title as string | null,
          size: data.size as string | null,
          color: data.color as string | null,
          colorHex: data.colorHex as string | null,
          priceToman: data.priceToman as number | null,
          compareAtPriceToman: data.compareAtPriceToman as number | null,
          isActive: data.isActive as boolean,
          optionValues:
            optionValueCreate?.create?.map(({ optionValue }) => ({
              optionValueId: optionValue.connect.id,
            })) ?? [],
          inventory: { onHand: 0, reserved: 0, reorderPoint: 0 },
        });
        variants.push(variant);
        return cloneVariant(variant);
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; productId: string; updatedAt: Date };
        data: Record<string, unknown>;
      }) => {
        if (options.forcedVariantUpdateCount !== undefined) {
          return { count: options.forcedVariantUpdateCount };
        }
        const variant = variants.find(
          (candidate) =>
            candidate.id === where.id &&
            candidate.productId === where.productId &&
            candidate.updatedAt.getTime() === where.updatedAt.getTime(),
        );
        if (!variant) return { count: 0 };
        Object.assign(variant, data, { updatedAt: new Date('2026-09-08T09:00:00.000Z') });
        return { count: 1 };
      },
    },
    productOptionValue: {
      findMany: async ({
        where,
      }: {
        where: { id: { in: string[] }; option: { productId: string } };
      }) =>
        optionValues.filter(
          (value) => where.id.in.includes(value.id) && value.productId === where.option.productId,
        ),
    },
    productVariantOptionValue: {
      deleteMany: async ({ where }: { where: { variantId: string } }) => {
        const variant = variants.find((candidate) => candidate.id === where.variantId);
        if (!variant) return { count: 0 };
        const count = variant.optionValues.length;
        variant.optionValues = [];
        return { count };
      },
      createMany: async ({
        data,
      }: {
        data: Array<{ variantId: string; optionValueId: string }>;
      }) => {
        const variant = variants.find((candidate) => candidate.id === data[0]?.variantId);
        if (variant) variant.optionValues = data.map(({ optionValueId }) => ({ optionValueId }));
        return { count: data.length };
      },
    },
    productMedia: {
      findMany: async () => media.map(cloneMedia),
      findUnique: async ({ where }: { where: { id: string } }) => {
        const item = media.find((candidate) => candidate.id === where.id);
        return item
          ? { ...cloneMedia(item), product: { id: product.id, status: product.status } }
          : null;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const item = createMedia({
          id: 'media-2',
          productId: product.id,
          url: data.url as string,
          altText: data.altText as string,
          kind: data.kind as FakeMedia['kind'],
          sortOrder: data.sortOrder as number,
          width: data.width as number | null,
          height: data.height as number | null,
        });
        media.push(item);
        return cloneMedia(item);
      },
      count: async ({ where }: { where: { productId: string; kind: FakeMedia['kind'] } }) =>
        media.filter((item) => item.productId === where.productId && item.kind === where.kind)
          .length,
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; productId: string };
        data: Record<string, unknown>;
      }) => {
        const item = media.find(
          (candidate) => candidate.id === where.id && candidate.productId === where.productId,
        );
        if (!item) return { count: 0 };
        Object.assign(item, data);
        return { count: 1 };
      },
      deleteMany: async ({ where }: { where: { id: string; productId: string } }) => {
        const index = media.findIndex(
          (candidate) => candidate.id === where.id && candidate.productId === where.productId,
        );
        if (index < 0) return { count: 0 };
        media.splice(index, 1);
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
    $transaction: async <T>(callback: (value: typeof transaction) => Promise<T>): Promise<T> =>
      callback(transaction),
  };
  const audit = new AuditService({ prisma } as never);
  const service = new CatalogAdminService({ prisma } as never, audit);

  return { service, variants, media, audits };
}

test('creates an active variant with a zero-stock inventory row and audit', async () => {
  const { service, variants, audits } = createService();
  const input = Object.assign(new CreateAdminProductVariantDto(), {
    sku: ' nova-linen-001-l ',
    title: '  کرم / L  ',
    size: ' L ',
    color: ' کرم ',
    colorHex: '#d9c8ad',
    priceToman: 2_490_000,
  });

  const result = await service.createVariant(createAdmin(), 'product-1', input);

  assert.equal(result.sku, 'NOVA-LINEN-001-L');
  assert.equal(result.title, 'کرم / L');
  assert.equal(result.inventory?.onHand, 0);
  assert.equal(result.isActive, true);
  assert.equal(variants.length, 2);
  assert.equal(audits[0]?.action, 'catalog.product.variant_created');
});

test('assigns same-product option values and rejects two values from one option', async () => {
  const { service, variants } = createService();
  const input = Object.assign(new CreateAdminProductVariantDto(), {
    sku: 'NOVA-LINEN-001-L',
    optionValueIds: ['color-cream'],
  });

  const result = await service.createVariant(createAdmin(), 'product-1', input);

  assert.deepEqual(result.optionValueIds, ['color-cream']);
  assert.deepEqual(variants[1]?.optionValues, [{ optionValueId: 'color-cream' }]);

  const invalid = Object.assign(new CreateAdminProductVariantDto(), {
    sku: 'NOVA-LINEN-001-XL',
    optionValueIds: ['color-cream', 'color-black'],
  });
  await assert.rejects(
    service.createVariant(createAdmin(), 'product-1', invalid),
    (error: unknown) => error instanceof Error && error.message.includes('فقط می‌تواند یک مقدار'),
  );
});

test('rejects variant compare-at prices that are not above the effective price', async () => {
  const { service, variants, audits } = createService();
  const invalidCreate = Object.assign(new CreateAdminProductVariantDto(), {
    sku: 'NOVA-LINEN-001-INVALID',
    priceToman: 1_200_000,
    compareAtPriceToman: 1_100_000,
  });

  await assert.rejects(
    service.createVariant(createAdmin(), 'product-1', invalidCreate),
    (error: unknown) => error instanceof BadRequestException,
  );

  const invalidUpdate = Object.assign(new UpdateAdminProductVariantDto(), {
    priceToman: 3_000_000,
  });
  await assert.rejects(
    service.updateVariant(createAdmin(), 'product-1', 'variant-1', invalidUpdate),
    (error: unknown) => error instanceof BadRequestException,
  );

  assert.equal(variants.length, 1);
  assert.equal(audits.length, 0);
});

test('rejects an inherited product compare-at price when a variant price override makes it invalid', async () => {
  const { service, variants, audits } = createService({
    productCompareAtPriceToman: 2_890_000,
    variants: [createVariant({ priceToman: null, compareAtPriceToman: null })],
  });
  const input = Object.assign(new UpdateAdminProductVariantDto(), {
    priceToman: 3_000_000,
  });

  await assert.rejects(
    service.updateVariant(createAdmin(), 'product-1', 'variant-1', input),
    (error: unknown) => error instanceof BadRequestException,
  );
  assert.equal(variants[0]?.priceToman, null);
  assert.equal(audits.length, 0);
});

test('updates a variant without deleting its inventory and records changed fields', async () => {
  const { service, variants, audits } = createService();
  const input = Object.assign(new UpdateAdminProductVariantDto(), {
    colorHex: '#aabbcc',
    isActive: false,
  });

  const result = await service.updateVariant(createAdmin(), 'product-1', 'variant-1', input);

  assert.equal(result.isActive, false);
  assert.equal(result.colorHex, '#AABBCC');
  assert.deepEqual(result.inventory, { onHand: 4, reserved: 0, reorderPoint: 2 });
  assert.equal(variants[0]?.isActive, false);
  assert.deepEqual(audits[0]?.metadata, {
    productId: 'product-1',
    sku: 'NOVA-LINEN-001-M',
    changedFields: ['colorHex', 'isActive'],
  });
});

test('rejects a lost variant update without writing an audit', async () => {
  const { service, audits } = createService({ forcedVariantUpdateCount: 0 });
  const input = Object.assign(new UpdateAdminProductVariantDto(), { isActive: false });

  await assert.rejects(
    service.updateVariant(createAdmin(), 'product-1', 'variant-1', input),
    (error: unknown) =>
      error instanceof ConflictException &&
      (error.getResponse() as { code?: string }).code === 'PRODUCT_VARIANT_UPDATE_CONFLICT',
  );
  assert.equal(audits.length, 0);
});

test('keeps published products from losing their last primary image', async () => {
  const { service, audits } = createService({ productStatus: 'PUBLISHED' });
  const input = Object.assign(new UpdateAdminProductMediaDto(), { kind: 'DETAIL' });

  await assert.rejects(
    service.updateMedia(createAdmin(), 'product-1', 'media-1', input),
    (error: unknown) =>
      error instanceof ConflictException &&
      (error.getResponse() as { code?: string }).code === 'PRODUCT_PRIMARY_MEDIA_REQUIRED',
  );
  await assert.rejects(
    service.deleteMedia(createAdmin(), 'product-1', 'media-1'),
    (error: unknown) =>
      error instanceof ConflictException &&
      (error.getResponse() as { code?: string }).code === 'PRODUCT_PRIMARY_MEDIA_REQUIRED',
  );
  assert.equal(audits.length, 0);
});

test('creates media, then permits deleting one primary while another remains', async () => {
  const { service, media, audits } = createService({ productStatus: 'PUBLISHED' });
  const input = Object.assign(new CreateAdminProductMediaDto(), {
    url: 'https://cdn.nova.test/linen-back.webp',
    altText: 'نمای پشت مانتوی لینن',
    kind: 'PRODUCT',
    sortOrder: 1,
  });

  const created = await service.createMedia(createAdmin(), 'product-1', input);
  const deleted = await service.deleteMedia(createAdmin(), 'product-1', created.id);

  assert.equal(created.kind, 'PRODUCT');
  assert.deepEqual(deleted, { deleted: true });
  assert.equal(media.length, 1);
  assert.deepEqual(
    audits.map((audit) => audit.action),
    ['catalog.product.media_created', 'catalog.product.media_deleted'],
  );
});

test('allows staff to read assets but keeps asset writes admin-only', async () => {
  const { service } = createService();
  const support: AuthenticatedStaff = { ...createAdmin(), roles: ['support'] };

  const variants = await service.listVariants(support, 'product-1');
  const media = await service.listMedia(support, 'product-1');

  assert.equal(variants.length, 1);
  assert.equal(media.length, 1);
  await assert.rejects(
    service.createVariant(support, 'product-1', new CreateAdminProductVariantDto()),
    (error: unknown) => error instanceof ForbiddenException,
  );
});
