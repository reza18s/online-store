import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import type { AuthenticatedStaff } from '../auth/session.service';
import { CatalogAdminService } from './catalog-admin.service';
import {
  CreateAdminCategoryDto,
  CreateAdminProductOptionDto,
  CreateAdminProductOptionValueDto,
  ReplaceProductCategoriesDto,
  UpdateAdminCategoryDto,
  UpdateAdminCategoryStatusDto,
  UpdateAdminProductOptionDto,
  UpdateAdminProductOptionValueDto,
} from './dto/admin-taxonomy.dto';

interface FakeCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  productIds: string[];
}

interface FakeOptionValue {
  id: string;
  optionId: string;
  key: string;
  label: string;
  sortOrder: number;
  variantCount: number;
}

interface FakeOption {
  id: string;
  productId: string;
  key: string;
  name: string;
  sortOrder: number;
  values: FakeOptionValue[];
}

interface AuditRecord {
  actorType: string;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata?: unknown;
}

function categoryView(category: FakeCategory, categories: FakeCategory[]) {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    parentId: category.parentId,
    archivedAt: category.archivedAt,
    createdAt: new Date(category.createdAt),
    updatedAt: new Date(category.updatedAt),
    _count: {
      products: category.productIds.length,
      children: categories.filter((candidate) => candidate.parentId === category.id).length,
    },
  };
}

function optionView(option: FakeOption) {
  return {
    id: option.id,
    productId: option.productId,
    key: option.key,
    name: option.name,
    sortOrder: option.sortOrder,
    values: option.values.map((value) => ({
      id: value.id,
      optionId: value.optionId,
      key: value.key,
      label: value.label,
      sortOrder: value.sortOrder,
      _count: { variantValues: value.variantCount },
    })),
  };
}

function valueView(value: FakeOptionValue) {
  return {
    id: value.id,
    optionId: value.optionId,
    key: value.key,
    label: value.label,
    sortOrder: value.sortOrder,
    _count: { variantValues: value.variantCount },
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

function createService(productStatus: 'DRAFT' | 'PUBLISHED' = 'DRAFT') {
  const categories: FakeCategory[] = [
    {
      id: 'category-women',
      slug: 'women',
      name: 'زنانه',
      description: null,
      parentId: null,
      archivedAt: null,
      createdAt: new Date('2026-09-07T08:00:00.000Z'),
      updatedAt: new Date('2026-09-08T08:00:00.000Z'),
      productIds: ['product-1'],
    },
    {
      id: 'category-archived',
      slug: 'archived',
      name: 'آرشیوشده',
      description: null,
      parentId: null,
      archivedAt: new Date('2026-09-07T08:00:00.000Z'),
      createdAt: new Date('2026-09-07T08:00:00.000Z'),
      updatedAt: new Date('2026-09-08T08:00:00.000Z'),
      productIds: [],
    },
  ];
  const options: FakeOption[] = [
    {
      id: 'option-color',
      productId: 'product-1',
      key: 'color',
      name: 'رنگ',
      sortOrder: 0,
      values: [
        {
          id: 'value-cream',
          optionId: 'option-color',
          key: 'cream',
          label: 'کرم',
          sortOrder: 0,
          variantCount: 1,
        },
      ],
    },
  ];
  const assignments = [{ productId: 'product-1', categoryId: 'category-women' }];
  const product = {
    id: 'product-1',
    status: productStatus,
    archivedAt: null as Date | null,
    updatedAt: new Date('2026-09-08T08:00:00.000Z'),
  };
  const audits: AuditRecord[] = [];

  const transaction = {
    category: {
      findMany: async () => categories.map((category) => categoryView(category, categories)),
      findUnique: async ({ where }: { where: { id: string } }) => {
        const category = categories.find((candidate) => candidate.id === where.id);
        return category ? categoryView(category, categories) : null;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const category: FakeCategory = {
          id: `category-${categories.length + 1}`,
          slug: data.slug as string,
          name: data.name as string,
          description: data.description as string | null,
          parentId: data.parentId as string | null,
          archivedAt: null,
          createdAt: new Date('2026-09-08T09:00:00.000Z'),
          updatedAt: new Date('2026-09-08T09:00:00.000Z'),
          productIds: [],
        };
        categories.push(category);
        return categoryView(category, categories);
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; updatedAt: Date };
        data: Record<string, unknown>;
      }) => {
        const category = categories.find(
          (candidate) =>
            candidate.id === where.id &&
            candidate.updatedAt.getTime() === where.updatedAt.getTime(),
        );
        if (!category) return { count: 0 };
        Object.assign(category, data, {
          updatedAt: new Date('2026-09-08T09:30:00.000Z'),
        });
        return { count: 1 };
      },
    },
    product: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        where.id === product.id ? { id: product.id, updatedAt: new Date(product.updatedAt) } : null,
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; updatedAt: Date };
        data: Record<string, unknown>;
      }) => {
        if (where.id !== product.id || where.updatedAt.getTime() !== product.updatedAt.getTime()) {
          return { count: 0 };
        }
        Object.assign(product, data, { updatedAt: new Date('2026-09-08T09:30:00.000Z') });
        return { count: 1 };
      },
    },
    productCategory: {
      findMany: async ({ select }: { select?: Record<string, unknown> }) => {
        if (select?.categoryId) {
          return assignments.map(({ categoryId }) => ({ categoryId }));
        }
        return assignments.flatMap(({ categoryId }) => {
          const category = categories.find((candidate) => candidate.id === categoryId);
          return category ? [{ category: categoryView(category, categories) }] : [];
        });
      },
      count: async ({ where }: { where: { categoryId: string; product: { status: string } } }) =>
        assignments.filter(
          ({ categoryId, productId }) =>
            categoryId === where.categoryId &&
            productId === product.id &&
            product.status === 'PUBLISHED',
        ).length,
      updateMany: async () => ({ count: 1 }),
      deleteMany: async ({ where }: { where: { productId: string } }) => {
        const before = assignments.length;
        for (let index = assignments.length - 1; index >= 0; index -= 1) {
          if (assignments[index]?.productId === where.productId) assignments.splice(index, 1);
        }
        return { count: before - assignments.length };
      },
      createMany: async ({ data }: { data: Array<{ productId: string; categoryId: string }> }) => {
        assignments.push(...data);
        for (const assignment of data) {
          const category = categories.find((candidate) => candidate.id === assignment.categoryId);
          if (category && !category.productIds.includes(assignment.productId)) {
            category.productIds.push(assignment.productId);
          }
        }
        return { count: data.length };
      },
    },
    productOption: {
      findMany: async () => options.map(optionView),
      findUnique: async ({
        where,
        select,
      }: {
        where: { id: string };
        select?: Record<string, unknown>;
      }) => {
        const option = options.find((candidate) => candidate.id === where.id);
        if (!option) return null;
        return select?.values ? optionView(option) : { id: option.id, productId: option.productId };
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const option: FakeOption = {
          id: `option-${options.length + 1}`,
          productId: product.id,
          key: data.key as string,
          name: data.name as string,
          sortOrder: data.sortOrder as number,
          values: [],
        };
        options.push(option);
        return optionView(option);
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; productId: string };
        data: Record<string, unknown>;
      }) => {
        const option = options.find(
          (candidate) => candidate.id === where.id && candidate.productId === where.productId,
        );
        if (!option) return { count: 0 };
        Object.assign(option, data);
        return { count: 1 };
      },
    },
    productOptionValue: {
      findUnique: async ({
        where,
        select,
      }: {
        where: { id: string };
        select?: Record<string, unknown>;
      }) => {
        const value = options
          .flatMap((option) => option.values)
          .find((candidate) => candidate.id === where.id);
        if (!value) return null;
        const option = options.find((candidate) => candidate.id === value.optionId);
        if (!option) return null;
        return select?.option
          ? { ...valueView(value), option: { id: option.id, productId: option.productId } }
          : valueView(value);
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const optionId = (data.option as { connect: { id: string } }).connect.id;
        const option = options.find((candidate) => candidate.id === optionId);
        if (!option) throw new Error('option not found');
        const value: FakeOptionValue = {
          id: `value-${option.values.length + 1}`,
          optionId,
          key: data.key as string,
          label: data.label as string,
          sortOrder: data.sortOrder as number,
          variantCount: 0,
        };
        option.values.push(value);
        return valueView(value);
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; optionId: string };
        data: Record<string, unknown>;
      }) => {
        const value = options
          .flatMap((option) => option.values)
          .find((candidate) => candidate.id === where.id && candidate.optionId === where.optionId);
        if (!value) return { count: 0 };
        Object.assign(value, data);
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

  return { service, categories, options, assignments, audits };
}

test('creates categories, normalizes names, and blocks parent cycles', async () => {
  const { service, categories, audits } = createService();
  const parent = Object.assign(new CreateAdminCategoryDto(), {
    slug: 'outerwear',
    name: '  رویه‌ها  ',
  });
  const created = await service.createCategory(createAdmin(), parent);
  assert.equal(created.slug, 'outerwear');
  assert.equal(created.name, 'رویه‌ها');

  const child = Object.assign(new CreateAdminCategoryDto(), {
    slug: 'coats',
    name: 'پالتو',
    parentId: created.id,
  });
  const createdChild = await service.createCategory(createAdmin(), child);
  assert.equal(createdChild.parentId, created.id);

  const invalidUpdate = Object.assign(new UpdateAdminCategoryDto(), {
    parentId: createdChild.id,
  });
  await assert.rejects(
    service.updateCategory(createAdmin(), created.id, invalidUpdate),
    (error: unknown) =>
      error instanceof ConflictException &&
      (error.getResponse() as { code?: string }).code === 'CATEGORY_PARENT_CYCLE',
  );
  assert.equal(categories.length, 4);
  assert.deepEqual(
    audits.map((audit) => audit.action),
    ['catalog.category.created', 'catalog.category.created'],
  );
});

test('archives categories safely and keeps published assignments visible', async () => {
  const { service, audits } = createService('PUBLISHED');
  const input = Object.assign(new UpdateAdminCategoryStatusDto(), { archived: true });

  await assert.rejects(
    service.updateCategoryStatus(createAdmin(), 'category-women', input),
    (error: unknown) =>
      error instanceof ConflictException &&
      (error.getResponse() as { code?: string }).code === 'CATEGORY_ARCHIVE_BLOCKED',
  );
  assert.equal(audits.length, 0);
});

test('replaces product categories with active categories and audits the assignment', async () => {
  const { service, assignments, audits } = createService();
  const input = Object.assign(new ReplaceProductCategoriesDto(), {
    categoryIds: ['category-archived'],
  });

  await assert.rejects(
    service.replaceProductCategories(createAdmin(), 'product-1', input),
    (error: unknown) =>
      error instanceof ConflictException &&
      (error.getResponse() as { code?: string }).code === 'PRODUCT_CATEGORY_INVALID',
  );

  const valid = Object.assign(new ReplaceProductCategoriesDto(), { categoryIds: [] });
  const result = await service.replaceProductCategories(createAdmin(), 'product-1', valid);
  assert.deepEqual(result, []);
  assert.deepEqual(assignments, []);
  assert.equal(audits[0]?.action, 'catalog.product.categories_replaced');
});

test('creates and edits product options and values while preserving role boundaries', async () => {
  const { service, options, audits } = createService();
  const support: AuthenticatedStaff = { ...createAdmin(), roles: ['support'] };
  const createOption = Object.assign(new CreateAdminProductOptionDto(), {
    key: 'size',
    name: '  اندازه  ',
  });

  await assert.rejects(
    service.createOption(support, 'product-1', createOption),
    (error: unknown) => error instanceof ForbiddenException,
  );
  const option = await service.createOption(createAdmin(), 'product-1', createOption);
  assert.equal(option.key, 'size');
  assert.equal(option.name, 'اندازه');

  const createValue = Object.assign(new CreateAdminProductOptionValueDto(), {
    key: 'medium',
    label: '  متوسط  ',
  });
  const value = await service.createOptionValue(createAdmin(), 'product-1', option.id, createValue);
  assert.equal(value.label, 'متوسط');

  const updateOption = Object.assign(new UpdateAdminProductOptionDto(), { name: 'سایز' });
  const updatedOption = await service.updateOption(
    createAdmin(),
    'product-1',
    option.id,
    updateOption,
  );
  assert.equal(updatedOption.name, 'سایز');

  const updateValue = Object.assign(new UpdateAdminProductOptionValueDto(), { label: 'M' });
  const updatedValue = await service.updateOptionValue(
    createAdmin(),
    'product-1',
    option.id,
    value.id,
    updateValue,
  );
  assert.equal(updatedValue.label, 'M');
  assert.equal(options.find((candidate) => candidate.id === option.id)?.values.length, 1);
  assert.deepEqual(
    audits.map((audit) => audit.action),
    [
      'catalog.product.option_created',
      'catalog.product.option_value_created',
      'catalog.product.option_updated',
      'catalog.product.option_value_updated',
    ],
  );
});

test('rejects malformed taxonomy input before writing', async () => {
  const { service, audits } = createService();
  const invalid = Object.assign(new CreateAdminProductOptionDto(), {
    key: 'bad key',
    name: 'رنگ',
  });

  await assert.rejects(
    service.createOption(createAdmin(), 'product-1', invalid),
    (error: unknown) => error instanceof BadRequestException,
  );
  assert.equal(audits.length, 0);
});
