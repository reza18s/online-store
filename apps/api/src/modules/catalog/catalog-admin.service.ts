import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@nova/db';
import type { ProductStatus } from '@nova/db';

import { DatabaseService } from '../../database/database.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { assertStaffRole } from '../staff-auth/staff-auth.guard';
import { AdminProductListQueryDto } from './dto/admin-product-list.query';
import {
  ADMIN_PRODUCT_MEDIA_KINDS,
  ADMIN_PRODUCT_SLUG_PATTERN,
  POSTGRES_INT_MAX,
} from './dto/admin-product.dto';
import type {
  AdminProductMediaKind,
  CreateAdminProductDto,
  CreateAdminProductMediaDto,
  CreateAdminProductVariantDto,
  UpdateAdminProductDto,
  UpdateAdminProductMediaDto,
  UpdateAdminProductVariantDto,
} from './dto/admin-product.dto';
import type {
  CompleteAdminProductMediaDto,
  PresignAdminProductMediaDto,
} from './dto/admin-product.dto';
import {
  ADMIN_CATALOG_KEY_PATTERN,
  ADMIN_CATEGORY_SLUG_PATTERN,
  CreateAdminCategoryDto,
  CreateAdminProductOptionDto,
  CreateAdminProductOptionValueDto,
  ReplaceProductCategoriesDto,
  UpdateAdminCategoryDto,
  UpdateAdminCategoryStatusDto,
  UpdateAdminProductOptionDto,
  UpdateAdminProductOptionValueDto,
} from './dto/admin-taxonomy.dto';
import { normalizeSearchText } from './dto/product-list.query';
import { CATALOG_PRODUCT_STATUSES, type CatalogProductStatus } from './dto/product-status.dto';
import {
  CATALOG_MEDIA_STORAGE,
  DisabledCatalogMediaStorage,
  CatalogMediaStorageError,
  type CatalogMediaCompletedAsset,
  type CatalogMediaStorage,
  type CatalogMediaUploadInput,
} from './catalog-media.storage';

const PRODUCT_SLUG_MAX_LENGTH = 120;
const PRODUCT_NAME_MAX_LENGTH = 200;
const PRODUCT_SHORT_DESCRIPTION_MAX_LENGTH = 280;
const PRODUCT_DESCRIPTION_MAX_LENGTH = 10_000;
const PRODUCT_BRAND_MAX_LENGTH = 120;
const PRODUCT_COLOR_HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;
const CATALOG_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const CATEGORY_DESCRIPTION_MAX_LENGTH = 1_000;
const CATEGORY_NAME_MAX_LENGTH = 200;
const OPTION_KEY_MAX_LENGTH = 64;
const OPTION_NAME_MAX_LENGTH = 120;
const OPTION_SORT_ORDER_MAX = 100_000;
const MEDIA_ASSET_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

const ALLOWED_STATUS_TRANSITIONS: Record<CatalogProductStatus, readonly CatalogProductStatus[]> = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['DRAFT', 'ARCHIVED'],
  ARCHIVED: ['DRAFT'],
};

const productLifecycleSelect = {
  id: true,
  slug: true,
  name: true,
  status: true,
  publishedAt: true,
  archivedAt: true,
  variants: {
    where: { isActive: true },
    select: {
      id: true,
      optionValues: { select: { optionValue: { select: { optionId: true } } } },
    },
  },
  options: {
    select: { id: true },
  },
  media: {
    where: { kind: 'PRODUCT' },
    select: { id: true },
  },
} as const;

const productListSelect = {
  id: true,
  slug: true,
  name: true,
  basePriceToman: true,
  compareAtPriceToman: true,
  status: true,
  publishedAt: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  categories: {
    where: { category: { archivedAt: null } },
    select: {
      category: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
  },
  media: {
    where: { kind: 'PRODUCT' },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    take: 1,
    select: { url: true, altText: true },
  },
  variants: {
    where: { isActive: true },
    select: {
      inventory: {
        select: {
          onHand: true,
          reserved: true,
          reorderPoint: true,
        },
      },
    },
  },
  _count: {
    select: {
      variants: true,
      media: true,
    },
  },
} satisfies Prisma.ProductSelect;

const productDetailSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  description: true,
  brand: true,
  basePriceToman: true,
  compareAtPriceToman: true,
  status: true,
  publishedAt: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const productVariantSelect = {
  id: true,
  productId: true,
  sku: true,
  title: true,
  size: true,
  color: true,
  colorHex: true,
  priceToman: true,
  compareAtPriceToman: true,
  isActive: true,
  optionValues: {
    orderBy: { optionValue: { sortOrder: 'asc' } },
    select: { optionValueId: true },
  },
  createdAt: true,
  updatedAt: true,
  inventory: {
    select: {
      onHand: true,
      reserved: true,
      reorderPoint: true,
    },
  },
} as const;

const categorySelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  parentId: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      products: true,
      children: true,
    },
  },
} as const;

const productOptionSelect = {
  id: true,
  productId: true,
  key: true,
  name: true,
  sortOrder: true,
  values: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      optionId: true,
      key: true,
      label: true,
      sortOrder: true,
      _count: { select: { variantValues: true } },
    },
  },
} satisfies Prisma.ProductOptionSelect;

const productOptionValueSelect = {
  id: true,
  optionId: true,
  key: true,
  label: true,
  sortOrder: true,
  _count: { select: { variantValues: true } },
} satisfies Prisma.ProductOptionValueSelect;

const productMediaSelect = {
  id: true,
  productId: true,
  url: true,
  altText: true,
  kind: true,
  sortOrder: true,
  width: true,
  height: true,
} as const;

interface CatalogAdminProductSource {
  id: string;
  slug: string;
  name: string;
  status: ProductStatus;
  publishedAt: Date | null;
  archivedAt: Date | null;
  variants: Array<{
    id: string;
    optionValues: Array<{ optionValue: { optionId: string } }>;
  }>;
  options: Array<{ id: string }>;
  media: Array<{ id: string }>;
}

interface CatalogAdminProductVariantSource {
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
  inventory: {
    onHand: number;
    reserved: number;
    reorderPoint: number;
  } | null;
}

interface CatalogAdminProductMediaSource {
  id: string;
  productId: string;
  url: string;
  altText: string;
  kind: AdminProductMediaKind;
  sortOrder: number;
  width: number | null;
  height: number | null;
}

interface CatalogAdminCategorySource {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { products: number; children: number };
}

interface CatalogAdminProductOptionValueSource {
  id: string;
  optionId: string;
  key: string;
  label: string;
  sortOrder: number;
  _count: { variantValues: number };
}

interface CatalogAdminProductOptionSource {
  id: string;
  productId: string;
  key: string;
  name: string;
  sortOrder: number;
  values: CatalogAdminProductOptionValueSource[];
}

export interface CatalogAdminProductView {
  id: string;
  slug: string;
  name: string;
  status: CatalogProductStatus;
  publishedAt: Date | null;
  archivedAt: Date | null;
}

export interface CatalogAdminProductListItem extends CatalogAdminProductView {
  basePriceToman: number;
  compareAtPriceToman: number | null;
  categories: Array<{ id: string; slug: string; name: string }>;
  primaryMedia: { url: string; altText: string } | null;
  inventory: {
    available: number;
    lowStockVariantCount: number;
    outOfStockVariantCount: number;
    status: CatalogAdminProductStockStatus;
  };
  variantCount: number;
  mediaCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CatalogAdminProductStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface CatalogAdminProductPage {
  items: CatalogAdminProductListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CatalogAdminProductDetail extends CatalogAdminProductView {
  shortDescription: string | null;
  description: string | null;
  brand: string | null;
  basePriceToman: number;
  compareAtPriceToman: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogAdminProductVariant {
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
  optionValueIds: string[];
  inventory: {
    onHand: number;
    reserved: number;
    reorderPoint: number;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogAdminProductMedia {
  id: string;
  productId: string;
  url: string;
  altText: string;
  kind: AdminProductMediaKind;
  sortOrder: number;
  width: number | null;
  height: number | null;
}

export interface CatalogAdminCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  archivedAt: Date | null;
  productCount: number;
  childCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogAdminProductOptionValue {
  id: string;
  optionId: string;
  key: string;
  label: string;
  sortOrder: number;
  variantCount: number;
}

export interface CatalogAdminProductOption {
  id: string;
  productId: string;
  key: string;
  name: string;
  sortOrder: number;
  values: CatalogAdminProductOptionValue[];
}

function normalizeCatalogId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !CATALOG_ID_PATTERN.test(value)) {
    throw new BadRequestException(`${field} معتبر نیست.`);
  }
  return value;
}

function normalizeProductId(productId: string): string {
  return normalizeCatalogId(productId, 'شناسه محصول');
}

function normalizeCategoryId(categoryId: unknown): string {
  return normalizeCatalogId(categoryId, 'شناسه دسته‌بندی');
}

function normalizeOptionId(optionId: unknown): string {
  return normalizeCatalogId(optionId, 'شناسه گزینه');
}

function normalizeOptionValueId(optionValueId: unknown): string {
  return normalizeCatalogId(optionValueId, 'شناسه مقدار گزینه');
}

function isCatalogProductStatus(value: string): value is CatalogProductStatus {
  return (CATALOG_PRODUCT_STATUSES as readonly string[]).includes(value);
}

function toProductView(source: CatalogAdminProductSource): CatalogAdminProductView {
  return {
    id: source.id,
    slug: source.slug,
    name: source.name,
    status: source.status,
    publishedAt: source.publishedAt,
    archivedAt: source.archivedAt,
  };
}

function toProductListItem(source: {
  id: string;
  slug: string;
  name: string;
  basePriceToman: number;
  compareAtPriceToman: number | null;
  status: ProductStatus;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  categories: Array<{
    category: { id: string; slug: string; name: string };
  }>;
  media: Array<{ url: string; altText: string }>;
  variants: Array<{
    inventory: { onHand: number; reserved: number; reorderPoint: number } | null;
  }>;
  _count: { variants: number; media: number };
}): CatalogAdminProductListItem {
  const inventory = toProductInventorySummary(source.variants);

  return {
    id: source.id,
    slug: source.slug,
    name: source.name,
    basePriceToman: source.basePriceToman,
    compareAtPriceToman: source.compareAtPriceToman,
    status: source.status,
    publishedAt: source.publishedAt,
    archivedAt: source.archivedAt,
    categories: source.categories.map(({ category }) => category),
    primaryMedia: source.media[0] ?? null,
    inventory,
    variantCount: source._count.variants,
    mediaCount: source._count.media,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

function toProductInventorySummary(
  variants: Array<{
    inventory: { onHand: number; reserved: number; reorderPoint: number } | null;
  }>,
): CatalogAdminProductListItem['inventory'] {
  let available = 0;
  let lowStockVariantCount = 0;
  let outOfStockVariantCount = 0;

  for (const variant of variants) {
    const item = variant.inventory;
    const variantAvailable = item ? Math.max(0, item.onHand - item.reserved) : 0;
    available += variantAvailable;

    if (variantAvailable <= 0) {
      outOfStockVariantCount += 1;
    } else if (variantAvailable <= (item?.reorderPoint ?? 0)) {
      lowStockVariantCount += 1;
    }
  }

  const status =
    variants.length === 0 || outOfStockVariantCount === variants.length
      ? 'OUT_OF_STOCK'
      : lowStockVariantCount > 0 || outOfStockVariantCount > 0
        ? 'LOW_STOCK'
        : 'IN_STOCK';

  return {
    available,
    lowStockVariantCount,
    outOfStockVariantCount,
    status,
  };
}

function transitionData(status: CatalogProductStatus, now: Date) {
  switch (status) {
    case 'PUBLISHED':
      return { status: 'PUBLISHED' as const, publishedAt: now, archivedAt: null };
    case 'ARCHIVED':
      return { status: 'ARCHIVED' as const, archivedAt: now };
    case 'DRAFT':
      return { status: 'DRAFT' as const, publishedAt: null, archivedAt: null };
  }
}

function requiredText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string') throw new BadRequestException(`${field} معتبر نیست.`);
  const normalized = value.trim().normalize('NFKC').replace(/\s+/gu, ' ');
  if (!normalized) throw new BadRequestException(`${field} نمی‌تواند خالی باشد.`);
  if (normalized.length > maxLength)
    throw new BadRequestException(`${field} بیش از حد طولانی است.`);
  return normalized;
}

function productSlug(value: unknown): string {
  if (typeof value !== 'string') throw new BadRequestException('شناسه یکتای محصول معتبر نیست.');
  const normalized = value.trim().normalize('NFKC').toLocaleLowerCase('en-US');
  if (
    normalized.length === 0 ||
    normalized.length > PRODUCT_SLUG_MAX_LENGTH ||
    !ADMIN_PRODUCT_SLUG_PATTERN.test(normalized)
  ) {
    throw new BadRequestException('شناسه یکتای محصول معتبر نیست.');
  }
  return normalized;
}

function optionalText(value: unknown, field: string, maxLength: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') throw new BadRequestException(`${field} معتبر نیست.`);
  const normalized = value.trim().normalize('NFKC');
  if (normalized.length > maxLength)
    throw new BadRequestException(`${field} بیش از حد طولانی است.`);
  return normalized || null;
}

function money(value: unknown, field: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > POSTGRES_INT_MAX
  ) {
    throw new BadRequestException(`${field} معتبر نیست.`);
  }
  return value;
}

function optionalMoney(value: unknown, field: string): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return money(value, field);
}

function assertCompareAtPrice(
  basePriceToman: number,
  compareAtPriceToman: number | null,
  field: string,
): void {
  if (compareAtPriceToman !== null && compareAtPriceToman <= basePriceToman) {
    throw new BadRequestException(`${field} باید بیشتر از قیمت فعلی باشد.`);
  }
}

async function assertProductVariantPrices(
  transaction: Prisma.TransactionClient,
  productId: string,
  basePriceToman: number,
  compareAtPriceToman: number | null,
): Promise<void> {
  const variants = await transaction.productVariant.findMany({
    where: { productId },
    select: { priceToman: true, compareAtPriceToman: true },
  });

  for (const variant of variants) {
    const activePriceToman = variant.priceToman ?? basePriceToman;
    const effectiveCompareAtPriceToman = variant.compareAtPriceToman ?? compareAtPriceToman;
    assertCompareAtPrice(activePriceToman, effectiveCompareAtPriceToman, 'قیمت قبل تنوع');
  }
}

function normalizeCreateInput(input: CreateAdminProductDto) {
  const slug = productSlug(input.slug);
  const name = requiredText(input.name, 'نام محصول', PRODUCT_NAME_MAX_LENGTH);
  const shortDescription =
    optionalText(input.shortDescription, 'توضیحات کوتاه', PRODUCT_SHORT_DESCRIPTION_MAX_LENGTH) ??
    null;
  const description =
    optionalText(input.description, 'توضیحات محصول', PRODUCT_DESCRIPTION_MAX_LENGTH) ?? null;
  const brand = optionalText(input.brand, 'برند', PRODUCT_BRAND_MAX_LENGTH) ?? null;
  const basePriceToman = money(input.basePriceToman, 'قیمت پایه');
  const compareAtPriceToman = optionalMoney(input.compareAtPriceToman, 'قیمت قبل') ?? null;
  assertCompareAtPrice(basePriceToman, compareAtPriceToman, 'قیمت قبل');

  return {
    slug,
    name,
    shortDescription,
    description,
    brand,
    basePriceToman,
    compareAtPriceToman,
  };
}

function normalizeUpdateInput(input: UpdateAdminProductDto) {
  const data = {
    ...(input.name === undefined
      ? {}
      : { name: requiredText(input.name, 'نام محصول', PRODUCT_NAME_MAX_LENGTH) }),
    ...(input.shortDescription === undefined
      ? {}
      : {
          shortDescription: optionalText(
            input.shortDescription,
            'توضیحات کوتاه',
            PRODUCT_SHORT_DESCRIPTION_MAX_LENGTH,
          ),
        }),
    ...(input.description === undefined
      ? {}
      : {
          description: optionalText(
            input.description,
            'توضیحات محصول',
            PRODUCT_DESCRIPTION_MAX_LENGTH,
          ),
        }),
    ...(input.brand === undefined
      ? {}
      : { brand: optionalText(input.brand, 'برند', PRODUCT_BRAND_MAX_LENGTH) }),
    ...(input.basePriceToman === undefined
      ? {}
      : { basePriceToman: money(input.basePriceToman, 'قیمت پایه') }),
    ...(input.compareAtPriceToman === undefined
      ? {}
      : { compareAtPriceToman: optionalMoney(input.compareAtPriceToman, 'قیمت قبل') }),
  };

  if (Object.keys(data).length === 0) {
    throw new BadRequestException('حداقل یک فیلد برای ویرایش محصول ارسال کنید.');
  }
  return data;
}

function searchTextFor(input: {
  slug: string;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  brand?: string | null;
}): string {
  return normalizeSearchText(
    [input.slug, input.name, input.shortDescription, input.description, input.brand]
      .filter(Boolean)
      .join(' '),
  );
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function toProductDetail(source: {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  brand: string | null;
  basePriceToman: number;
  compareAtPriceToman: number | null;
  status: ProductStatus;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): CatalogAdminProductDetail {
  return { ...source, status: source.status };
}

function toProductVariant(source: CatalogAdminProductVariantSource): CatalogAdminProductVariant {
  return {
    ...source,
    optionValueIds: source.optionValues.map(({ optionValueId }) => optionValueId),
  };
}

function toProductMedia(source: CatalogAdminProductMediaSource): CatalogAdminProductMedia {
  return { ...source };
}

function toCategory(source: CatalogAdminCategorySource): CatalogAdminCategory {
  return {
    id: source.id,
    slug: source.slug,
    name: source.name,
    description: source.description,
    parentId: source.parentId,
    archivedAt: source.archivedAt,
    productCount: source._count.products,
    childCount: source._count.children,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

function toProductOptionValue(
  source: CatalogAdminProductOptionValueSource,
): CatalogAdminProductOptionValue {
  return {
    id: source.id,
    optionId: source.optionId,
    key: source.key,
    label: source.label,
    sortOrder: source.sortOrder,
    variantCount: source._count.variantValues,
  };
}

function toProductOption(source: CatalogAdminProductOptionSource): CatalogAdminProductOption {
  return {
    id: source.id,
    productId: source.productId,
    key: source.key,
    name: source.name,
    sortOrder: source.sortOrder,
    values: source.values.map(toProductOptionValue),
  };
}

function variantSku(value: unknown): string {
  if (typeof value !== 'string') throw new BadRequestException('کد تنوع محصول معتبر نیست.');
  const normalized = value.trim().normalize('NFKC').toLocaleUpperCase('en-US');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(normalized)) {
    throw new BadRequestException('کد تنوع محصول معتبر نیست.');
  }
  return normalized;
}

function colorHex(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') throw new BadRequestException('کد رنگ معتبر نیست.');
  const normalized = value.trim().toUpperCase();
  if (!PRODUCT_COLOR_HEX_PATTERN.test(normalized)) {
    throw new BadRequestException('کد رنگ معتبر نیست.');
  }
  return normalized;
}

function integerInRange(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new BadRequestException(`${field} معتبر نیست.`);
  }
  return value;
}

function optionalPositiveDimension(value: unknown, field: string): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return integerInRange(value, field, 1, 10_000);
}

function mediaUrl(value: unknown): string {
  if (typeof value !== 'string') throw new BadRequestException('نشانی تصویر معتبر نیست.');
  const normalized = value.trim().normalize('NFKC');
  if (!normalized) throw new BadRequestException('نشانی تصویر نمی‌تواند خالی باشد.');
  if (normalized.startsWith('/') && !normalized.startsWith('//')) return normalized;

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('unsupported media protocol');
    }
  } catch {
    throw new BadRequestException('نشانی تصویر معتبر نیست.');
  }
  return normalized;
}

function mediaKind(value: unknown): AdminProductMediaKind {
  if (
    typeof value !== 'string' ||
    !(ADMIN_PRODUCT_MEDIA_KINDS as readonly string[]).includes(value)
  ) {
    throw new BadRequestException('نوع تصویر معتبر نیست.');
  }
  return value as AdminProductMediaKind;
}

function mediaAssetId(value: unknown): string {
  if (typeof value !== 'string') throw new BadRequestException('شناسه فایل تصویر معتبر نیست.');
  const normalized = value.trim().normalize('NFKC');
  if (!MEDIA_ASSET_ID_PATTERN.test(normalized)) {
    throw new BadRequestException('شناسه فایل تصویر معتبر نیست.');
  }
  return normalized;
}

function mediaStorageInput(
  productId: string,
  assetId: string,
  input: PresignAdminProductMediaDto | CompleteAdminProductMediaDto,
): CatalogMediaUploadInput {
  return {
    productId,
    assetId,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    width: input.width,
    height: input.height,
  };
}

function rethrowMediaStorageError(error: unknown): never {
  if (!(error instanceof CatalogMediaStorageError)) throw error;
  if (
    error.code === 'MEDIA_CONTENT_TYPE_INVALID' ||
    error.code === 'MEDIA_SIZE_INVALID' ||
    error.code === 'MEDIA_DIMENSIONS_INVALID' ||
    error.code === 'MEDIA_KEY_INVALID' ||
    error.code === 'MEDIA_CONTENT_TYPE_MISMATCH' ||
    error.code === 'MEDIA_SIZE_MISMATCH' ||
    error.code === 'MEDIA_METADATA_MISMATCH'
  ) {
    throw new BadRequestException({ code: error.code, message: 'اطلاعات فایل تصویر معتبر نیست.' });
  }
  if (error.code === 'MEDIA_OBJECT_NOT_READY') {
    throw new ConflictException({
      code: 'PRODUCT_MEDIA_OBJECT_NOT_READY',
      message: 'فایل اصلی و مشتق تصویر هنوز آماده نیستند.',
    });
  }
  if (error.code === 'MEDIA_QUARANTINE_FAILED') {
    throw new ServiceUnavailableException({
      code: 'PRODUCT_MEDIA_QUARANTINE_UNAVAILABLE',
      message: 'پاک‌سازی امن تصویر موقتاً در دسترس نیست.',
    });
  }
  throw new ServiceUnavailableException({
    code: 'PRODUCT_MEDIA_STORAGE_UNAVAILABLE',
    message: 'ذخیره‌سازی تصویر موقتاً در دسترس نیست.',
  });
}

function catalogKey(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new BadRequestException(`${field} معتبر نیست.`);
  const normalized = value.trim().normalize('NFKC').toLocaleLowerCase('en-US');
  if (
    normalized.length === 0 ||
    normalized.length > OPTION_KEY_MAX_LENGTH ||
    !ADMIN_CATALOG_KEY_PATTERN.test(normalized)
  ) {
    throw new BadRequestException(`${field} معتبر نیست.`);
  }
  return normalized;
}

function categorySlug(value: unknown): string {
  if (typeof value !== 'string') throw new BadRequestException('شناسه یکتای دسته‌بندی معتبر نیست.');
  const normalized = value.trim().normalize('NFKC').toLocaleLowerCase('en-US');
  if (
    normalized.length === 0 ||
    normalized.length > PRODUCT_SLUG_MAX_LENGTH ||
    !ADMIN_CATEGORY_SLUG_PATTERN.test(normalized)
  ) {
    throw new BadRequestException('شناسه یکتای دسته‌بندی معتبر نیست.');
  }
  return normalized;
}

function optionalCategoryParent(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return normalizeCategoryId(value);
}

function normalizeCategoryCreateInput(input: CreateAdminCategoryDto) {
  return {
    slug: categorySlug(input.slug),
    name: requiredText(input.name, 'نام دسته‌بندی', CATEGORY_NAME_MAX_LENGTH),
    description:
      optionalText(input.description, 'توضیحات دسته‌بندی', CATEGORY_DESCRIPTION_MAX_LENGTH) ?? null,
    parentId: optionalCategoryParent(input.parentId),
  };
}

function normalizeCategoryUpdateInput(input: UpdateAdminCategoryDto) {
  const data = {
    ...(input.name === undefined
      ? {}
      : { name: requiredText(input.name, 'نام دسته‌بندی', CATEGORY_NAME_MAX_LENGTH) }),
    ...(input.description === undefined
      ? {}
      : {
          description: optionalText(
            input.description,
            'توضیحات دسته‌بندی',
            CATEGORY_DESCRIPTION_MAX_LENGTH,
          ),
        }),
    ...(input.parentId === undefined ? {} : { parentId: optionalCategoryParent(input.parentId) }),
  };
  if (Object.keys(data).length === 0) {
    throw new BadRequestException('حداقل یک فیلد برای ویرایش دسته‌بندی ارسال کنید.');
  }
  return data;
}

function normalizeCategoryIds(input: ReplaceProductCategoriesDto): string[] {
  if (!Array.isArray(input.categoryIds)) {
    throw new BadRequestException('فهرست دسته‌بندی‌ها معتبر نیست.');
  }
  const categoryIds = input.categoryIds.map(normalizeCategoryId);
  if (new Set(categoryIds).size !== categoryIds.length) {
    throw new BadRequestException('دسته‌بندی‌ها نباید تکراری باشند.');
  }
  return categoryIds;
}

function normalizeOptionCreateInput(input: CreateAdminProductOptionDto) {
  return {
    key: catalogKey(input.key, 'کلید گزینه'),
    name: requiredText(input.name, 'نام گزینه', OPTION_NAME_MAX_LENGTH),
    sortOrder:
      input.sortOrder === undefined
        ? 0
        : integerInRange(input.sortOrder, 'ترتیب گزینه', 0, OPTION_SORT_ORDER_MAX),
  };
}

function normalizeOptionUpdateInput(input: UpdateAdminProductOptionDto) {
  const data = {
    ...(input.name === undefined
      ? {}
      : { name: requiredText(input.name, 'نام گزینه', OPTION_NAME_MAX_LENGTH) }),
    ...(input.sortOrder === undefined
      ? {}
      : { sortOrder: integerInRange(input.sortOrder, 'ترتیب گزینه', 0, OPTION_SORT_ORDER_MAX) }),
  };
  if (Object.keys(data).length === 0) {
    throw new BadRequestException('حداقل یک فیلد برای ویرایش گزینه ارسال کنید.');
  }
  return data;
}

function normalizeOptionValueCreateInput(input: CreateAdminProductOptionValueDto) {
  return {
    key: catalogKey(input.key, 'کلید مقدار گزینه'),
    label: requiredText(input.label, 'برچسب مقدار گزینه', OPTION_NAME_MAX_LENGTH),
    sortOrder:
      input.sortOrder === undefined
        ? 0
        : integerInRange(input.sortOrder, 'ترتیب مقدار گزینه', 0, OPTION_SORT_ORDER_MAX),
  };
}

function normalizeOptionValueUpdateInput(input: UpdateAdminProductOptionValueDto) {
  const data = {
    ...(input.label === undefined
      ? {}
      : { label: requiredText(input.label, 'برچسب مقدار گزینه', OPTION_NAME_MAX_LENGTH) }),
    ...(input.sortOrder === undefined
      ? {}
      : {
          sortOrder: integerInRange(input.sortOrder, 'ترتیب مقدار گزینه', 0, OPTION_SORT_ORDER_MAX),
        }),
  };
  if (Object.keys(data).length === 0) {
    throw new BadRequestException('حداقل یک فیلد برای ویرایش مقدار گزینه ارسال کنید.');
  }
  return data;
}

function normalizeOptionValueIds(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new BadRequestException('مقادیر گزینه‌های تنوع معتبر نیستند.');
  }
  const ids = value.map(normalizeOptionValueId);
  if (new Set(ids).size !== ids.length) {
    throw new BadRequestException('مقادیر گزینه‌های تنوع نباید تکراری باشند.');
  }
  return [...ids].sort();
}

function normalizeVariantCreateInput(input: CreateAdminProductVariantDto) {
  return {
    fields: {
      sku: variantSku(input.sku),
      title: optionalText(input.title, 'عنوان تنوع', 200) ?? null,
      size: optionalText(input.size, 'اندازه', 80) ?? null,
      color: optionalText(input.color, 'رنگ', 80) ?? null,
      colorHex: colorHex(input.colorHex) ?? null,
      priceToman: optionalMoney(input.priceToman, 'قیمت تنوع') ?? null,
      compareAtPriceToman: optionalMoney(input.compareAtPriceToman, 'قیمت قبل تنوع') ?? null,
      isActive: input.isActive ?? true,
    },
    optionValueIds: normalizeOptionValueIds(input.optionValueIds),
  };
}

function normalizeVariantUpdateInput(input: UpdateAdminProductVariantDto) {
  const data = {
    ...(input.title === undefined ? {} : { title: optionalText(input.title, 'عنوان تنوع', 200) }),
    ...(input.size === undefined ? {} : { size: optionalText(input.size, 'اندازه', 80) }),
    ...(input.color === undefined ? {} : { color: optionalText(input.color, 'رنگ', 80) }),
    ...(input.colorHex === undefined ? {} : { colorHex: colorHex(input.colorHex) }),
    ...(input.priceToman === undefined
      ? {}
      : { priceToman: optionalMoney(input.priceToman, 'قیمت تنوع') }),
    ...(input.compareAtPriceToman === undefined
      ? {}
      : { compareAtPriceToman: optionalMoney(input.compareAtPriceToman, 'قیمت قبل تنوع') }),
    ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
  };
  const optionValueIds = normalizeOptionValueIds(input.optionValueIds);
  if (Object.keys(data).length === 0 && optionValueIds === undefined) {
    throw new BadRequestException('حداقل یک فیلد برای ویرایش تنوع ارسال کنید.');
  }
  return { data, optionValueIds };
}

function normalizeMediaCreateInput(input: CreateAdminProductMediaDto) {
  return {
    url: mediaUrl(input.url),
    altText: requiredText(input.altText, 'متن جایگزین تصویر', 240),
    kind: input.kind === undefined ? ('PRODUCT' as const) : mediaKind(input.kind),
    sortOrder:
      input.sortOrder === undefined
        ? 0
        : integerInRange(input.sortOrder, 'ترتیب تصویر', 0, 100_000),
    width: optionalPositiveDimension(input.width, 'عرض تصویر') ?? null,
    height: optionalPositiveDimension(input.height, 'ارتفاع تصویر') ?? null,
  };
}

function normalizeMediaUpdateInput(input: UpdateAdminProductMediaDto) {
  const data = {
    ...(input.url === undefined ? {} : { url: mediaUrl(input.url) }),
    ...(input.altText === undefined
      ? {}
      : { altText: requiredText(input.altText, 'متن جایگزین تصویر', 240) }),
    ...(input.kind === undefined ? {} : { kind: mediaKind(input.kind) }),
    ...(input.sortOrder === undefined
      ? {}
      : { sortOrder: integerInRange(input.sortOrder, 'ترتیب تصویر', 0, 100_000) }),
    ...(input.width === undefined
      ? {}
      : { width: optionalPositiveDimension(input.width, 'عرض تصویر') }),
    ...(input.height === undefined
      ? {}
      : { height: optionalPositiveDimension(input.height, 'ارتفاع تصویر') }),
  };
  if (Object.keys(data).length === 0) {
    throw new BadRequestException('حداقل یک فیلد برای ویرایش تصویر ارسال کنید.');
  }
  return data;
}

function normalizeStoredMediaCreateInput(input: CompleteAdminProductMediaDto) {
  return {
    altText: requiredText(input.altText, 'متن جایگزین تصویر', 240),
    kind: input.kind === undefined ? ('PRODUCT' as const) : mediaKind(input.kind),
    sortOrder:
      input.sortOrder === undefined
        ? 0
        : integerInRange(input.sortOrder, 'ترتیب تصویر', 0, 100_000),
    width: optionalPositiveDimension(input.width, 'عرض تصویر') ?? null,
    height: optionalPositiveDimension(input.height, 'ارتفاع تصویر') ?? null,
  };
}

async function assertCategoryParent(
  transaction: Prisma.TransactionClient,
  parentId: string | null,
  categoryId?: string,
): Promise<void> {
  if (parentId === null) return;
  if (categoryId !== undefined && parentId === categoryId) {
    throw new ConflictException({
      code: 'CATEGORY_PARENT_CYCLE',
      message: 'دسته‌بندی نمی‌تواند والد خودش باشد.',
    });
  }

  const visited = new Set<string>();
  let currentId: string | null = parentId;
  for (let depth = 0; currentId !== null && depth < 128; depth += 1) {
    if (visited.has(currentId)) {
      throw new ConflictException({
        code: 'CATEGORY_PARENT_CYCLE',
        message: 'ساختار والد دسته‌بندی حلقه ایجاد می‌کند.',
      });
    }
    visited.add(currentId);

    const parent: { id: string; parentId: string | null; archivedAt: Date | null } | null =
      await transaction.category.findUnique({
        where: { id: currentId },
        select: { id: true, parentId: true, archivedAt: true },
      });
    if (!parent) throw new NotFoundException('دسته‌بندی والد پیدا نشد.');
    if (parent.archivedAt !== null) {
      throw new ConflictException({
        code: 'CATEGORY_PARENT_ARCHIVED',
        message: 'دسته‌بندی والد آرشیو شده است.',
      });
    }
    if (categoryId !== undefined && parent.id === categoryId) {
      throw new ConflictException({
        code: 'CATEGORY_PARENT_CYCLE',
        message: 'ساختار والد دسته‌بندی حلقه ایجاد می‌کند.',
      });
    }
    currentId = parent.parentId;
  }

  if (currentId !== null) {
    throw new ConflictException({
      code: 'CATEGORY_PARENT_CYCLE',
      message: 'عمق درخت دسته‌بندی بیش از حد مجاز است.',
    });
  }
}

async function assertVariantOptionValues(
  transaction: Prisma.TransactionClient,
  productId: string,
  optionValueIds: string[] | undefined,
): Promise<void> {
  if (optionValueIds === undefined || optionValueIds.length === 0) return;

  const values = await transaction.productOptionValue.findMany({
    where: {
      id: { in: optionValueIds },
      option: { productId },
    },
    select: { id: true, optionId: true },
  });
  if (values.length !== optionValueIds.length) {
    throw new BadRequestException('یکی از مقادیر گزینه به این محصول تعلق ندارد.');
  }

  if (new Set(values.map((value) => value.optionId)).size !== values.length) {
    throw new BadRequestException('هر تنوع فقط می‌تواند یک مقدار از هر گزینه داشته باشد.');
  }
}

@Injectable()
export class CatalogAdminService {
  private readonly storage: CatalogMediaStorage;

  public constructor(
    private readonly database: DatabaseService,
    private readonly audit: AuditService,
    @Optional() @Inject(CATALOG_MEDIA_STORAGE) storage?: CatalogMediaStorage,
  ) {
    this.storage = storage ?? new DisabledCatalogMediaStorage();
  }

  public async listCategories(staff: AuthenticatedStaff): Promise<CatalogAdminCategory[]> {
    assertStaffRole(staff, 'support', 'operations', 'admin');
    const categories = await this.database.prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      select: categorySelect,
    });
    return categories.map(toCategory);
  }

  public async createCategory(
    staff: AuthenticatedStaff,
    input: CreateAdminCategoryDto,
  ): Promise<CatalogAdminCategory> {
    assertStaffRole(staff, 'admin');
    const fields = normalizeCategoryCreateInput(input);

    try {
      return await this.database.prisma.$transaction(async (transaction) => {
        await assertCategoryParent(transaction, fields.parentId);
        const category = await transaction.category.create({
          data: fields,
          select: categorySelect,
        });
        await this.audit.record(
          {
            actorType: 'STAFF',
            actorUserId: staff.id,
            action: 'catalog.category.created',
            resourceType: 'Category',
            resourceId: category.id,
            metadata: { slug: category.slug, parentId: category.parentId },
          },
          transaction,
        );
        return toCategory(category);
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'CATEGORY_SLUG_EXISTS',
          message: 'این شناسه دسته‌بندی قبلاً ثبت شده است.',
        });
      }
      throw error;
    }
  }

  public async updateCategory(
    staff: AuthenticatedStaff,
    categoryId: string,
    input: UpdateAdminCategoryDto,
  ): Promise<CatalogAdminCategory> {
    assertStaffRole(staff, 'admin');
    const id = normalizeCategoryId(categoryId);
    const data = normalizeCategoryUpdateInput(input);

    return this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.category.findUnique({
        where: { id },
        select: categorySelect,
      });
      if (!current) throw new NotFoundException('دسته‌بندی پیدا نشد.');

      const changedFields = Object.keys(data).filter(
        (field) => current[field as keyof typeof current] !== data[field as keyof typeof data],
      );
      if (changedFields.length === 0) return toCategory(current);

      if (Object.hasOwn(data, 'parentId')) {
        await assertCategoryParent(transaction, data.parentId ?? null, id);
      }

      const update = await transaction.category.updateMany({
        where: { id, updatedAt: current.updatedAt },
        data,
      });
      if (update.count !== 1) {
        throw new ConflictException({
          code: 'CATEGORY_UPDATE_CONFLICT',
          message: 'دسته‌بندی هم‌زمان ویرایش شده است؛ دوباره تلاش کنید.',
        });
      }

      const updated = await transaction.category.findUnique({
        where: { id },
        select: categorySelect,
      });
      if (!updated) throw new NotFoundException('دسته‌بندی پس از ویرایش پیدا نشد.');
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'catalog.category.updated',
          resourceType: 'Category',
          resourceId: id,
          metadata: { slug: updated.slug, changedFields },
        },
        transaction,
      );
      return toCategory(updated);
    });
  }

  public async updateCategoryStatus(
    staff: AuthenticatedStaff,
    categoryId: string,
    input: UpdateAdminCategoryStatusDto,
  ): Promise<CatalogAdminCategory> {
    assertStaffRole(staff, 'admin');
    const id = normalizeCategoryId(categoryId);
    if (typeof input.archived !== 'boolean') {
      throw new BadRequestException('وضعیت دسته‌بندی معتبر نیست.');
    }

    return this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.category.findUnique({
        where: { id },
        select: categorySelect,
      });
      if (!current) throw new NotFoundException('دسته‌بندی پیدا نشد.');

      const isArchived = current.archivedAt !== null;
      if (isArchived === input.archived) return toCategory(current);

      if (input.archived) {
        const publishedProductCount = await transaction.productCategory.count({
          where: {
            categoryId: id,
            product: { status: 'PUBLISHED', archivedAt: null },
          },
        });
        if (publishedProductCount > 0) {
          throw new ConflictException({
            code: 'CATEGORY_ARCHIVE_BLOCKED',
            message: 'دسته‌بندی دارای محصول منتشرشده است و فعلاً قابل آرشیو نیست.',
          });
        }
      }

      const archivedAt = input.archived ? new Date() : null;
      const update = await transaction.category.updateMany({
        where: { id, updatedAt: current.updatedAt },
        data: { archivedAt },
      });
      if (update.count !== 1) {
        throw new ConflictException({
          code: 'CATEGORY_STATUS_CONFLICT',
          message: 'وضعیت دسته‌بندی هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.',
        });
      }

      const updated = await transaction.category.findUnique({
        where: { id },
        select: categorySelect,
      });
      if (!updated) throw new NotFoundException('دسته‌بندی پس از تغییر وضعیت پیدا نشد.');
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'catalog.category.status_changed',
          resourceType: 'Category',
          resourceId: id,
          metadata: { slug: current.slug, archived: input.archived },
        },
        transaction,
      );
      return toCategory(updated);
    });
  }

  public async createProduct(
    staff: AuthenticatedStaff,
    input: CreateAdminProductDto,
  ): Promise<CatalogAdminProductDetail> {
    assertStaffRole(staff, 'admin');
    const fields = normalizeCreateInput(input);

    try {
      return await this.database.prisma.$transaction(async (transaction) => {
        const product = await transaction.product.create({
          data: {
            ...fields,
            searchText: searchTextFor(fields),
            status: 'DRAFT',
            publishedAt: null,
            archivedAt: null,
          },
          select: productDetailSelect,
        });
        await this.audit.record(
          {
            actorType: 'STAFF',
            actorUserId: staff.id,
            action: 'catalog.product.created',
            resourceType: 'Product',
            resourceId: product.id,
            metadata: { productSlug: product.slug, status: product.status },
          },
          transaction,
        );
        return toProductDetail(product);
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'PRODUCT_SLUG_EXISTS',
          message: 'این شناسه محصول قبلاً ثبت شده است.',
        });
      }
      throw error;
    }
  }

  public async getProduct(
    staff: AuthenticatedStaff,
    productId: string,
  ): Promise<CatalogAdminProductDetail> {
    assertStaffRole(staff, 'support', 'operations', 'admin');
    const id = normalizeProductId(productId);
    const product = await this.database.prisma.product.findUnique({
      where: { id },
      select: productDetailSelect,
    });
    if (!product) throw new NotFoundException('محصول پیدا نشد.');
    return toProductDetail(product);
  }

  public async updateProduct(
    staff: AuthenticatedStaff,
    productId: string,
    input: UpdateAdminProductDto,
  ): Promise<CatalogAdminProductDetail> {
    assertStaffRole(staff, 'admin');
    const id = normalizeProductId(productId);
    const data = normalizeUpdateInput(input);

    return this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.product.findUnique({
        where: { id },
        select: productDetailSelect,
      });
      if (!current) throw new NotFoundException('محصول پیدا نشد.');
      const changedFields = Object.keys(data).filter(
        (field) => current[field as keyof typeof current] !== data[field as keyof typeof data],
      );
      if (changedFields.length === 0) return toProductDetail(current);
      const merged = { ...current, ...data };
      assertCompareAtPrice(merged.basePriceToman, merged.compareAtPriceToman, 'قیمت قبل');
      if (Object.hasOwn(data, 'basePriceToman') || Object.hasOwn(data, 'compareAtPriceToman')) {
        await assertProductVariantPrices(
          transaction,
          id,
          merged.basePriceToman,
          merged.compareAtPriceToman,
        );
      }
      const update = await transaction.product.updateMany({
        where: { id, updatedAt: current.updatedAt },
        data: { ...data, searchText: searchTextFor(merged) },
      });
      if (update.count !== 1) {
        throw new ConflictException({
          code: 'PRODUCT_UPDATE_CONFLICT',
          message: 'محصول هم‌زمان ویرایش شده است؛ دوباره تلاش کنید.',
        });
      }
      const updated = await transaction.product.findUnique({
        where: { id },
        select: productDetailSelect,
      });
      if (!updated) throw new NotFoundException('محصول پس از ویرایش پیدا نشد.');
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'catalog.product.updated',
          resourceType: 'Product',
          resourceId: id,
          metadata: { productSlug: updated.slug, changedFields },
        },
        transaction,
      );
      return toProductDetail(updated);
    });
  }

  public async listProductCategories(
    staff: AuthenticatedStaff,
    productId: string,
  ): Promise<CatalogAdminCategory[]> {
    assertStaffRole(staff, 'support', 'operations', 'admin');
    const id = normalizeProductId(productId);

    return this.database.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findUnique({ where: { id }, select: { id: true } });
      if (!product) throw new NotFoundException('محصول پیدا نشد.');
      const categories = await transaction.productCategory.findMany({
        where: { productId: id },
        orderBy: { category: { name: 'asc' } },
        select: { category: { select: categorySelect } },
      });
      return categories.map(({ category }) => toCategory(category));
    });
  }

  public async replaceProductCategories(
    staff: AuthenticatedStaff,
    productId: string,
    input: ReplaceProductCategoriesDto,
  ): Promise<CatalogAdminCategory[]> {
    assertStaffRole(staff, 'admin');
    const id = normalizeProductId(productId);
    const categoryIds = normalizeCategoryIds(input);

    return this.database.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findUnique({
        where: { id },
        select: { id: true, updatedAt: true },
      });
      if (!product) throw new NotFoundException('محصول پیدا نشد.');

      const currentAssignments = await transaction.productCategory.findMany({
        where: { productId: id },
        select: { categoryId: true },
      });
      const previousCategoryIds = currentAssignments.map(({ categoryId }) => categoryId).sort();
      const nextCategoryIds = [...categoryIds].sort();
      if (
        previousCategoryIds.length === nextCategoryIds.length &&
        previousCategoryIds.every((categoryId, index) => categoryId === nextCategoryIds[index])
      ) {
        const categories = await transaction.productCategory.findMany({
          where: { productId: id },
          orderBy: { category: { name: 'asc' } },
          select: { category: { select: categorySelect } },
        });
        return categories.map(({ category }) => toCategory(category));
      }

      const availableCategories =
        categoryIds.length === 0
          ? []
          : await transaction.category.findMany({
              where: { id: { in: categoryIds }, archivedAt: null },
              select: { id: true },
            });
      if (availableCategories.length !== categoryIds.length) {
        throw new ConflictException({
          code: 'PRODUCT_CATEGORY_INVALID',
          message: 'یکی از دسته‌بندی‌ها وجود ندارد یا آرشیو شده است.',
        });
      }

      const update = await transaction.product.updateMany({
        where: { id, updatedAt: product.updatedAt },
        data: { updatedAt: new Date() },
      });
      if (update.count !== 1) {
        throw new ConflictException({
          code: 'PRODUCT_CATEGORIES_UPDATE_CONFLICT',
          message: 'محصول هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.',
        });
      }

      await transaction.productCategory.deleteMany({ where: { productId: id } });
      if (categoryIds.length > 0) {
        await transaction.productCategory.createMany({
          data: categoryIds.map((categoryId) => ({ productId: id, categoryId })),
        });
      }

      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'catalog.product.categories_replaced',
          resourceType: 'Product',
          resourceId: id,
          metadata: { previousCategoryIds, categoryIds },
        },
        transaction,
      );

      const categories = await transaction.productCategory.findMany({
        where: { productId: id },
        orderBy: { category: { name: 'asc' } },
        select: { category: { select: categorySelect } },
      });
      return categories.map(({ category }) => toCategory(category));
    });
  }

  public async listOptions(
    staff: AuthenticatedStaff,
    productId: string,
  ): Promise<CatalogAdminProductOption[]> {
    assertStaffRole(staff, 'support', 'operations', 'admin');
    const id = normalizeProductId(productId);

    return this.database.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findUnique({ where: { id }, select: { id: true } });
      if (!product) throw new NotFoundException('محصول پیدا نشد.');
      const options = await transaction.productOption.findMany({
        where: { productId: id },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: productOptionSelect,
      });
      return options.map(toProductOption);
    });
  }

  public async createOption(
    staff: AuthenticatedStaff,
    productId: string,
    input: CreateAdminProductOptionDto,
  ): Promise<CatalogAdminProductOption> {
    assertStaffRole(staff, 'admin');
    const id = normalizeProductId(productId);
    const fields = normalizeOptionCreateInput(input);

    try {
      return await this.database.prisma.$transaction(async (transaction) => {
        const product = await transaction.product.findUnique({
          where: { id },
          select: { id: true },
        });
        if (!product) throw new NotFoundException('محصول پیدا نشد.');

        const option = await transaction.productOption.create({
          data: { ...fields, product: { connect: { id } } },
          select: productOptionSelect,
        });
        await this.audit.record(
          {
            actorType: 'STAFF',
            actorUserId: staff.id,
            action: 'catalog.product.option_created',
            resourceType: 'ProductOption',
            resourceId: option.id,
            metadata: { productId: id, key: option.key },
          },
          transaction,
        );
        return toProductOption(option);
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'PRODUCT_OPTION_KEY_EXISTS',
          message: 'این کلید گزینه برای محصول قبلاً ثبت شده است.',
        });
      }
      throw error;
    }
  }

  public async updateOption(
    staff: AuthenticatedStaff,
    productId: string,
    optionId: string,
    input: UpdateAdminProductOptionDto,
  ): Promise<CatalogAdminProductOption> {
    assertStaffRole(staff, 'admin');
    const product = normalizeProductId(productId);
    const option = normalizeOptionId(optionId);
    const data = normalizeOptionUpdateInput(input);

    return this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.productOption.findUnique({
        where: { id: option },
        select: productOptionSelect,
      });
      if (!current || current.productId !== product) {
        throw new NotFoundException('گزینه محصول پیدا نشد.');
      }

      const changedFields = Object.keys(data).filter(
        (field) => current[field as keyof typeof current] !== data[field as keyof typeof data],
      );
      if (changedFields.length === 0) return toProductOption(current);

      const update = await transaction.productOption.updateMany({
        where: { id: option, productId: product },
        data,
      });
      if (update.count !== 1) {
        throw new ConflictException({
          code: 'PRODUCT_OPTION_UPDATE_CONFLICT',
          message: 'گزینه محصول هم‌زمان ویرایش شده است؛ دوباره تلاش کنید.',
        });
      }

      const updated = await transaction.productOption.findUnique({
        where: { id: option },
        select: productOptionSelect,
      });
      if (!updated) throw new NotFoundException('گزینه محصول پس از ویرایش پیدا نشد.');
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'catalog.product.option_updated',
          resourceType: 'ProductOption',
          resourceId: option,
          metadata: { productId: product, key: updated.key, changedFields },
        },
        transaction,
      );
      return toProductOption(updated);
    });
  }

  public async createOptionValue(
    staff: AuthenticatedStaff,
    productId: string,
    optionId: string,
    input: CreateAdminProductOptionValueDto,
  ): Promise<CatalogAdminProductOptionValue> {
    assertStaffRole(staff, 'admin');
    const product = normalizeProductId(productId);
    const option = normalizeOptionId(optionId);
    const fields = normalizeOptionValueCreateInput(input);

    try {
      return await this.database.prisma.$transaction(async (transaction) => {
        const parent = await transaction.productOption.findUnique({
          where: { id: option },
          select: { id: true, productId: true },
        });
        if (!parent || parent.productId !== product) {
          throw new NotFoundException('گزینه محصول پیدا نشد.');
        }

        const value = await transaction.productOptionValue.create({
          data: { ...fields, option: { connect: { id: option } } },
          select: productOptionValueSelect,
        });
        await this.audit.record(
          {
            actorType: 'STAFF',
            actorUserId: staff.id,
            action: 'catalog.product.option_value_created',
            resourceType: 'ProductOptionValue',
            resourceId: value.id,
            metadata: { productId: product, optionId: option, key: value.key },
          },
          transaction,
        );
        return toProductOptionValue(value);
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'PRODUCT_OPTION_VALUE_KEY_EXISTS',
          message: 'این کلید مقدار گزینه قبلاً ثبت شده است.',
        });
      }
      throw error;
    }
  }

  public async updateOptionValue(
    staff: AuthenticatedStaff,
    productId: string,
    optionId: string,
    valueId: string,
    input: UpdateAdminProductOptionValueDto,
  ): Promise<CatalogAdminProductOptionValue> {
    assertStaffRole(staff, 'admin');
    const product = normalizeProductId(productId);
    const option = normalizeOptionId(optionId);
    const value = normalizeOptionValueId(valueId);
    const data = normalizeOptionValueUpdateInput(input);

    return this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.productOptionValue.findUnique({
        where: { id: value },
        select: {
          ...productOptionValueSelect,
          option: { select: { productId: true, id: true } },
        },
      });
      if (!current || current.option.id !== option || current.option.productId !== product) {
        throw new NotFoundException('مقدار گزینه محصول پیدا نشد.');
      }

      const changedFields = Object.keys(data).filter(
        (field) => current[field as keyof typeof current] !== data[field as keyof typeof data],
      );
      if (changedFields.length === 0) {
        return toProductOptionValue(current);
      }

      const update = await transaction.productOptionValue.updateMany({
        where: { id: value, optionId: option },
        data,
      });
      if (update.count !== 1) {
        throw new ConflictException({
          code: 'PRODUCT_OPTION_VALUE_UPDATE_CONFLICT',
          message: 'مقدار گزینه هم‌زمان ویرایش شده است؛ دوباره تلاش کنید.',
        });
      }

      const updated = await transaction.productOptionValue.findUnique({
        where: { id: value },
        select: productOptionValueSelect,
      });
      if (!updated) throw new NotFoundException('مقدار گزینه پس از ویرایش پیدا نشد.');
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'catalog.product.option_value_updated',
          resourceType: 'ProductOptionValue',
          resourceId: value,
          metadata: { productId: product, optionId: option, changedFields },
        },
        transaction,
      );
      return toProductOptionValue(updated);
    });
  }

  public async listVariants(
    staff: AuthenticatedStaff,
    productId: string,
  ): Promise<CatalogAdminProductVariant[]> {
    assertStaffRole(staff, 'support', 'operations', 'admin');
    const id = normalizeProductId(productId);

    return this.database.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findUnique({ where: { id }, select: { id: true } });
      if (!product) throw new NotFoundException('محصول پیدا نشد.');
      const variants = await transaction.productVariant.findMany({
        where: { productId: id },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: productVariantSelect,
      });
      return variants.map(toProductVariant);
    });
  }

  public async createVariant(
    staff: AuthenticatedStaff,
    productId: string,
    input: CreateAdminProductVariantDto,
  ): Promise<CatalogAdminProductVariant> {
    assertStaffRole(staff, 'admin');
    const id = normalizeProductId(productId);
    const { fields, optionValueIds } = normalizeVariantCreateInput(input);

    try {
      return await this.database.prisma.$transaction(async (transaction) => {
        const product = await transaction.product.findUnique({
          where: { id },
          select: { id: true, basePriceToman: true, compareAtPriceToman: true },
        });
        if (!product) throw new NotFoundException('محصول پیدا نشد.');
        assertCompareAtPrice(
          fields.priceToman ?? product.basePriceToman,
          fields.compareAtPriceToman ?? product.compareAtPriceToman,
          'قیمت قبل تنوع',
        );
        await assertVariantOptionValues(transaction, id, optionValueIds);

        const variant = await transaction.productVariant.create({
          data: {
            ...fields,
            product: { connect: { id } },
            inventory: { create: {} },
            ...(optionValueIds === undefined
              ? {}
              : {
                  optionValues: {
                    create: optionValueIds.map((optionValueId) => ({
                      optionValue: { connect: { id: optionValueId } },
                    })),
                  },
                }),
          },
          select: productVariantSelect,
        });
        await this.audit.record(
          {
            actorType: 'STAFF',
            actorUserId: staff.id,
            action: 'catalog.product.variant_created',
            resourceType: 'ProductVariant',
            resourceId: variant.id,
            metadata: { productId: id, sku: variant.sku },
          },
          transaction,
        );
        return toProductVariant(variant);
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'PRODUCT_VARIANT_SKU_EXISTS',
          message: 'این کد تنوع قبلاً ثبت شده است.',
        });
      }
      throw error;
    }
  }

  public async updateVariant(
    staff: AuthenticatedStaff,
    productId: string,
    variantId: string,
    input: UpdateAdminProductVariantDto,
  ): Promise<CatalogAdminProductVariant> {
    assertStaffRole(staff, 'admin');
    const product = normalizeProductId(productId);
    const variant = normalizeProductId(variantId);
    const { data, optionValueIds } = normalizeVariantUpdateInput(input);

    return this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.productVariant.findUnique({
        where: { id: variant },
        select: productVariantSelect,
      });
      if (!current || current.productId !== product) {
        throw new NotFoundException('تنوع محصول پیدا نشد.');
      }
      const owner = await transaction.product.findUnique({
        where: { id: product },
        select: { basePriceToman: true, compareAtPriceToman: true },
      });
      if (!owner) throw new NotFoundException('محصول پیدا نشد.');
      const effectivePriceToman =
        (data.priceToman === undefined ? current.priceToman : data.priceToman) ??
        owner.basePriceToman;
      const effectiveCompareAtPriceToman =
        (data.compareAtPriceToman === undefined
          ? current.compareAtPriceToman
          : data.compareAtPriceToman) ?? owner.compareAtPriceToman;
      assertCompareAtPrice(effectivePriceToman, effectiveCompareAtPriceToman, 'قیمت قبل تنوع');

      const currentOptionValueIds = current.optionValues
        .map(({ optionValueId }) => optionValueId)
        .sort();
      const optionValuesChanged =
        optionValueIds !== undefined &&
        (currentOptionValueIds.length !== optionValueIds.length ||
          currentOptionValueIds.some(
            (optionValueId, index) => optionValueId !== optionValueIds[index],
          ));
      const changedFields = Object.keys(data).filter(
        (field) => current[field as keyof typeof current] !== data[field as keyof typeof data],
      );
      if (optionValuesChanged) changedFields.push('optionValueIds');
      if (changedFields.length === 0) return toProductVariant(current);
      await assertVariantOptionValues(transaction, product, optionValueIds);

      const update = await transaction.productVariant.updateMany({
        where: { id: variant, productId: product, updatedAt: current.updatedAt },
        data: {
          ...data,
          ...(Object.keys(data).length === 0 ? { updatedAt: new Date() } : {}),
        },
      });
      if (update.count !== 1) {
        throw new ConflictException({
          code: 'PRODUCT_VARIANT_UPDATE_CONFLICT',
          message: 'تنوع محصول هم‌زمان ویرایش شده است؛ دوباره تلاش کنید.',
        });
      }

      if (optionValuesChanged) {
        await transaction.productVariantOptionValue.deleteMany({ where: { variantId: variant } });
        if (optionValueIds && optionValueIds.length > 0) {
          await transaction.productVariantOptionValue.createMany({
            data: optionValueIds.map((optionValueId) => ({
              variantId: variant,
              optionValueId,
            })),
          });
        }
      }

      const updated = await transaction.productVariant.findUnique({
        where: { id: variant },
        select: productVariantSelect,
      });
      if (!updated) throw new NotFoundException('تنوع محصول پس از ویرایش پیدا نشد.');
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'catalog.product.variant_updated',
          resourceType: 'ProductVariant',
          resourceId: variant,
          metadata: { productId: product, sku: updated.sku, changedFields },
        },
        transaction,
      );
      return toProductVariant(updated);
    });
  }

  public async listMedia(
    staff: AuthenticatedStaff,
    productId: string,
  ): Promise<CatalogAdminProductMedia[]> {
    assertStaffRole(staff, 'support', 'operations', 'admin');
    const id = normalizeProductId(productId);

    return this.database.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findUnique({ where: { id }, select: { id: true } });
      if (!product) throw new NotFoundException('محصول پیدا نشد.');
      const media = await transaction.productMedia.findMany({
        where: { productId: id, storageStatus: { not: 'QUARANTINED' } },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: productMediaSelect,
      });
      return media.map(toProductMedia);
    });
  }

  public async presignMedia(
    staff: AuthenticatedStaff,
    productId: string,
    input: PresignAdminProductMediaDto,
  ) {
    assertStaffRole(staff, 'admin');
    const product = normalizeProductId(productId);
    const productExists = await this.database.prisma.product.findUnique({
      where: { id: product },
      select: { id: true },
    });
    if (!productExists) throw new NotFoundException('محصول پیدا نشد.');

    const assetId = randomUUID();
    try {
      return await this.storage.createUpload(mediaStorageInput(product, assetId, input));
    } catch (error) {
      rethrowMediaStorageError(error);
    }
  }

  public async completeMedia(
    staff: AuthenticatedStaff,
    productId: string,
    input: CompleteAdminProductMediaDto,
  ): Promise<CatalogAdminProductMedia> {
    assertStaffRole(staff, 'admin');
    const product = normalizeProductId(productId);
    const assetId = mediaAssetId(input.assetId);
    const uploadInput = mediaStorageInput(product, assetId, input);
    const productExists = await this.database.prisma.product.findUnique({
      where: { id: product },
      select: { id: true },
    });
    if (!productExists) throw new NotFoundException('محصول پیدا نشد.');

    let asset: CatalogMediaCompletedAsset;
    try {
      asset = await this.storage.completeUpload(uploadInput);
    } catch (error) {
      rethrowMediaStorageError(error);
    }

    const fields = normalizeStoredMediaCreateInput(input);
    const mediaId = randomUUID();
    try {
      return await this.database.prisma.$transaction(async (transaction) => {
        const duplicate = await transaction.productMedia.findFirst({
          where: {
            OR: [
              { originalKey: asset.originalKey },
              { derivativeKey: asset.derivativeKey },
            ],
          },
          select: { id: true },
        });
        if (duplicate) {
          throw new ConflictException({
            code: 'PRODUCT_MEDIA_ASSET_ALREADY_ATTACHED',
            message: 'این فایل تصویر قبلاً به یک رسانه متصل شده است.',
          });
        }

        const media = await transaction.productMedia.create({
          data: {
            id: mediaId,
            ...fields,
            url: `/v1/catalog/media/${mediaId}`,
            storageStatus: 'READY',
            originalKey: asset.originalKey,
            derivativeKey: asset.derivativeKey,
            contentType: asset.contentType,
            sizeBytes: asset.sizeBytes,
            product: { connect: { id: product } },
          },
          select: productMediaSelect,
        });
        await this.audit.record(
          {
            actorType: 'STAFF',
            actorUserId: staff.id,
            action: 'catalog.product.media_created',
            resourceType: 'ProductMedia',
            resourceId: media.id,
            metadata: { productId: product, kind: media.kind, storageStatus: 'READY' },
          },
          transaction,
        );
        return toProductMedia(media);
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      try {
        await this.storage.quarantine({
          mediaId,
          productId: product,
          originalKey: asset.originalKey,
          derivativeKey: asset.derivativeKey,
        });
      } catch {
        // The original database error remains authoritative; the objects stay
        // unreferenced and are eligible for the storage quarantine sweep.
      }
      throw error;
    }
  }

  public async createMedia(
    staff: AuthenticatedStaff,
    productId: string,
    input: CreateAdminProductMediaDto,
  ): Promise<CatalogAdminProductMedia> {
    assertStaffRole(staff, 'admin');
    const id = normalizeProductId(productId);
    const fields = normalizeMediaCreateInput(input);

    return this.database.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findUnique({ where: { id }, select: { id: true } });
      if (!product) throw new NotFoundException('محصول پیدا نشد.');

      const media = await transaction.productMedia.create({
        data: { ...fields, product: { connect: { id } } },
        select: productMediaSelect,
      });
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'catalog.product.media_created',
          resourceType: 'ProductMedia',
          resourceId: media.id,
          metadata: { productId: id, kind: media.kind },
        },
        transaction,
      );
      return toProductMedia(media);
    });
  }

  public async updateMedia(
    staff: AuthenticatedStaff,
    productId: string,
    mediaId: string,
    input: UpdateAdminProductMediaDto,
  ): Promise<CatalogAdminProductMedia> {
    assertStaffRole(staff, 'admin');
    const product = normalizeProductId(productId);
    const media = normalizeProductId(mediaId);
    const data = normalizeMediaUpdateInput(input);

    return this.database.prisma.$transaction(async (transaction) => {
      const current = await transaction.productMedia.findUnique({
        where: { id: media },
        select: {
          ...productMediaSelect,
          storageStatus: true,
          originalKey: true,
          derivativeKey: true,
          product: { select: { id: true, status: true } },
        },
      });
      if (!current || current.productId !== product) {
        throw new NotFoundException('تصویر محصول پیدا نشد.');
      }

      const changedFields = Object.keys(data).filter(
        (field) => current[field as keyof typeof current] !== data[field as keyof typeof data],
      );
      if (changedFields.length === 0) return toProductMedia(current);

      const nextKind = data.kind ?? current.kind;
      if (
        current.product.status === 'PUBLISHED' &&
        current.kind === 'PRODUCT' &&
        nextKind !== 'PRODUCT'
      ) {
        const primaryCount = await transaction.productMedia.count({
          where: { productId: product, kind: 'PRODUCT' },
        });
        if (primaryCount <= 1) {
          throw new ConflictException({
            code: 'PRODUCT_PRIMARY_MEDIA_REQUIRED',
            message: 'محصول منتشرشده باید حداقل یک تصویر اصلی داشته باشد.',
          });
        }
      }

      const update = await transaction.productMedia.updateMany({
        where: { id: media, productId: product },
        data,
      });
      if (update.count !== 1) {
        throw new ConflictException({
          code: 'PRODUCT_MEDIA_UPDATE_CONFLICT',
          message: 'تصویر محصول هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.',
        });
      }

      const updated = await transaction.productMedia.findUnique({
        where: { id: media },
        select: productMediaSelect,
      });
      if (!updated) throw new NotFoundException('تصویر محصول پس از ویرایش پیدا نشد.');
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'catalog.product.media_updated',
          resourceType: 'ProductMedia',
          resourceId: media,
          metadata: { productId: product, changedFields },
        },
        transaction,
      );
      return toProductMedia(updated);
    });
  }

  public async deleteMedia(
    staff: AuthenticatedStaff,
    productId: string,
    mediaId: string,
  ): Promise<{ deleted: true }> {
    assertStaffRole(staff, 'admin');
    const product = normalizeProductId(productId);
    const media = normalizeProductId(mediaId);

    const current = await this.database.prisma.productMedia.findUnique({
      where: { id: media },
      select: {
        id: true,
        productId: true,
        kind: true,
        storageStatus: true,
        originalKey: true,
        derivativeKey: true,
        product: { select: { status: true } },
      },
    });
    if (!current || current.productId !== product) {
      throw new NotFoundException('تصویر محصول پیدا نشد.');
    }

    if (current.product.status === 'PUBLISHED' && current.kind === 'PRODUCT') {
      const primaryCount = await this.database.prisma.productMedia.count({
        where: { productId: product, kind: 'PRODUCT', storageStatus: { not: 'QUARANTINED' } },
      });
      if (primaryCount <= 1) {
        throw new ConflictException({
          code: 'PRODUCT_PRIMARY_MEDIA_REQUIRED',
          message: 'محصول منتشرشده باید حداقل یک تصویر اصلی داشته باشد.',
        });
      }
    }

    const hasStoredObjects =
      current.storageStatus === 'READY' &&
      current.originalKey !== null &&
      current.derivativeKey !== null;
    if (hasStoredObjects) {
      const originalKey = current.originalKey as string;
      const derivativeKey = current.derivativeKey as string;
      const quarantined = await this.database.prisma.productMedia.updateMany({
        where: { id: media, productId: product, storageStatus: 'READY' },
        data: { storageStatus: 'QUARANTINED' },
      });
      if (quarantined.count !== 1) {
        throw new ConflictException({
          code: 'PRODUCT_MEDIA_DELETE_CONFLICT',
          message: 'تصویر محصول هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.',
        });
      }
      try {
        await this.storage.quarantine({
          mediaId: media,
          productId: product,
          originalKey,
          derivativeKey,
        });
      } catch (error) {
        rethrowMediaStorageError(error);
      }
    }

    return this.database.prisma.$transaction(async (transaction) => {
      const deleted = await transaction.productMedia.deleteMany({
        where: {
          id: media,
          productId: product,
          ...(hasStoredObjects ? { storageStatus: 'QUARANTINED' } : {}),
        },
      });
      if (deleted.count !== 1) {
        throw new ConflictException({
          code: 'PRODUCT_MEDIA_DELETE_CONFLICT',
          message: 'تصویر محصول هم‌زمان حذف شده است؛ دوباره تلاش کنید.',
        });
      }
      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'catalog.product.media_deleted',
          resourceType: 'ProductMedia',
          resourceId: media,
          metadata: { productId: product, kind: current.kind },
        },
        transaction,
      );
      return { deleted: true as const };
    });
  }

  public async listProducts(
    staff: AuthenticatedStaff,
    query: AdminProductListQueryDto,
  ): Promise<CatalogAdminProductPage> {
    assertStaffRole(staff, 'support', 'operations', 'admin');

    const search = query.q ? query.q : undefined;
    const lowStockProductIds = query.lowStock
      ? (
          await this.database.prisma.$queryRaw<Array<{ id: string }>>`
            SELECT DISTINCT v."productId" AS "id"
            FROM "ProductVariant" v
            LEFT JOIN "InventoryItem" i ON i."variantId" = v."id"
            WHERE v."isActive" = true
              AND (
                i."id" IS NULL
                OR GREATEST(0, i."onHand" - i."reserved") <= i."reorderPoint"
              )
          `
        ).map(({ id }) => id)
      : undefined;
    const where: Prisma.ProductWhereInput = {
      ...(lowStockProductIds ? { id: { in: lowStockProductIds } } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.category
        ? {
            categories: {
              some: {
                category: {
                  slug: query.category,
                  archivedAt: null,
                },
              },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { searchText: { contains: search } },
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const skip = (query.page - 1) * query.limit;

    return this.database.prisma.$transaction(async (transaction) => {
      const [total, products] = await Promise.all([
        transaction.product.count({ where }),
        transaction.product.findMany({
          where,
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          skip,
          take: query.limit,
          select: productListSelect,
        }),
      ]);

      return {
        items: products.map(toProductListItem),
        total,
        page: query.page,
        limit: query.limit,
      };
    });
  }

  public async updateProductStatus(
    staff: AuthenticatedStaff,
    productId: string,
    targetStatus: CatalogProductStatus,
  ): Promise<CatalogAdminProductView> {
    assertStaffRole(staff, 'admin');
    const id = normalizeProductId(productId);
    if (!isCatalogProductStatus(targetStatus)) {
      throw new BadRequestException('وضعیت محصول معتبر نیست.');
    }

    return this.database.prisma.$transaction(async (transaction) => {
      const current = (await transaction.product.findUnique({
        where: { id },
        select: productLifecycleSelect,
      })) as CatalogAdminProductSource | null;

      if (!current) throw new NotFoundException('محصول پیدا نشد.');
      if (current.status === targetStatus) return toProductView(current);

      const allowedTargets = ALLOWED_STATUS_TRANSITIONS[current.status];
      if (!allowedTargets?.includes(targetStatus)) {
        throw new ConflictException({
          code: 'PRODUCT_STATUS_TRANSITION_INVALID',
          message: 'تغییر وضعیت محصول از وضعیت فعلی مجاز نیست.',
        });
      }

      if (targetStatus === 'PUBLISHED') {
        if (current.variants.length === 0) {
          throw new ConflictException({
            code: 'PRODUCT_PUBLISH_BLOCKED',
            message: 'برای انتشار، محصول باید حداقل یک تنوع فعال داشته باشد.',
          });
        }
        if (current.media.length === 0) {
          throw new ConflictException({
            code: 'PRODUCT_PUBLISH_BLOCKED',
            message: 'برای انتشار، محصول باید حداقل یک تصویر اصلی داشته باشد.',
          });
        }
        const optionIds = new Set((current.options ?? []).map((option) => option.id));
        if (optionIds.size > 0) {
          const hasIncompleteVariant = current.variants.some((variant) => {
            const selectedOptionIds = new Set(
              (variant.optionValues ?? []).map(({ optionValue }) => optionValue.optionId),
            );
            return (
              selectedOptionIds.size !== optionIds.size ||
              [...optionIds].some((optionId) => !selectedOptionIds.has(optionId))
            );
          });
          if (hasIncompleteVariant) {
            throw new ConflictException({
              code: 'PRODUCT_PUBLISH_BLOCKED',
              message: 'برای انتشار، هر تنوع باید برای همه گزینه‌های محصول مقدار داشته باشد.',
            });
          }
        }
      }

      const now = new Date();
      const update = await transaction.product.updateMany({
        where: { id, status: current.status },
        data: transitionData(targetStatus, now),
      });
      if (update.count !== 1) {
        throw new ConflictException({
          code: 'PRODUCT_STATUS_CONFLICT',
          message: 'وضعیت محصول هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.',
        });
      }

      const updated = (await transaction.product.findUnique({
        where: { id },
        select: productLifecycleSelect,
      })) as CatalogAdminProductSource | null;
      if (!updated) throw new NotFoundException('محصول پس از تغییر وضعیت پیدا نشد.');

      await this.audit.record(
        {
          actorType: 'STAFF',
          actorUserId: staff.id,
          action: 'catalog.product.status_changed',
          resourceType: 'Product',
          resourceId: current.id,
          metadata: {
            productSlug: current.slug,
            fromStatus: current.status,
            toStatus: targetStatus,
          },
        },
        transaction,
      );

      return toProductView(updated);
    });
  }
}
