import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  adminInventoryViewKey,
  adminProductStatusAction,
  adminProductEditorKey,
  buildAdminCatalogProductUpdateInput,
  canDeleteAdminProductMedia,
  hasAdminRole,
  isInventoryDiscrepancy,
  normalizeAdminCatalogInventoryView,
  resolveInventoryDetailState,
  resolveAdminMutationState,
  validateInventoryAdjustment,
  validateMediaDraft,
  validateProductDraft,
} from '@/features/catalog';
import { validateCatalogMediaFile } from '@/features/catalog/components/catalog-inventory/catalog-media-upload';

const validProduct = {
  slug: 'linen-overshirt',
  name: 'پیراهن لینن',
  shortDescription: '',
  description: '',
  brand: '',
  basePriceToman: '240000',
  compareAtPriceToman: '280000',
};

const productDetail = {
  name: 'پیراهن لینن',
  shortDescription: 'توضیح قبلی',
  description: 'جزئیات قبلی',
  brand: 'Nova',
  basePriceToman: 240000,
  compareAtPriceToman: 280000,
};

const media = (kind: 'PRODUCT' | 'DETAIL') => ({
  id: `${kind}-1`,
  productId: 'product-1',
  url: 'https://cdn.example/product.webp',
  altText: 'تصویر محصول',
  kind,
  sortOrder: 0,
  width: null,
  height: null,
});

describe('admin catalog/inventory page helpers', () => {
  test('normalizes route views without inventing a route', () => {
    assert.equal(normalizeAdminCatalogInventoryView('categories'), 'categories');
    assert.equal(normalizeAdminCatalogInventoryView('inventory'), 'inventory');
    assert.equal(normalizeAdminCatalogInventoryView('unknown'), 'catalog');
  });

  test('remounts the product editor when its route identity changes', () => {
    assert.equal(adminProductEditorKey(), 'new');
    assert.equal(adminProductEditorKey('A'), 'product:A');
    assert.notEqual(adminProductEditorKey('A'), adminProductEditorKey('B'));
  });

  test('remounts inventory detail when its route identity changes', () => {
    assert.equal(adminInventoryViewKey(), 'inventory');
    assert.equal(adminInventoryViewKey('A'), 'inventory:A');
    assert.notEqual(adminInventoryViewKey('A'), adminInventoryViewKey('B'));
  });

  test('keeps mutations visible only for the matching staff roles', () => {
    assert.equal(hasAdminRole(['support'], ['support', 'operations', 'admin']), true);
    assert.equal(hasAdminRole(['SUPPORT'], ['admin']), false);
    assert.equal(hasAdminRole(['operations'], ['operations', 'admin']), true);
    assert.equal(hasAdminRole(undefined, ['admin']), false);
  });

  test('validates product identifiers and price ordering', () => {
    assert.deepEqual(validateProductDraft(validProduct), []);
    assert.equal(validateProductDraft({ ...validProduct, slug: 'Not Valid' }).length, 1);
    assert.ok(
      validateProductDraft({ ...validProduct, compareAtPriceToman: '120000' }).includes(
        'قیمت قبل نباید کمتر از قیمت پایه باشد.',
      ),
    );
    assert.deepEqual(
      validateProductDraft({ ...validProduct, slug: 'ignored-for-edit' }, 'edit'),
      [],
    );
  });

  test('keeps API-supported product text fields in the edit payload', () => {
    assert.deepEqual(
      buildAdminCatalogProductUpdateInput(
        {
          slug: 'linen-overshirt',
          name: 'پیراهن لینن جدید',
          shortDescription: 'توضیح تازه',
          description: 'جزئیات تازه',
          brand: 'Nova Studio',
          basePriceToman: '250000',
          compareAtPriceToman: '',
        },
        productDetail,
      ),
      {
        name: 'پیراهن لینن جدید',
        shortDescription: 'توضیح تازه',
        description: 'جزئیات تازه',
        brand: 'Nova Studio',
        basePriceToman: 250000,
        compareAtPriceToman: null,
      },
    );
  });

  test('restores archived products to draft instead of attempting publish', () => {
    assert.deepEqual(adminProductStatusAction('ARCHIVED'), {
      label: 'بازیابی پیش‌نویس',
      targetStatus: 'DRAFT',
    });
    assert.deepEqual(adminProductStatusAction('DRAFT'), {
      label: 'انتشار',
      targetStatus: 'PUBLISHED',
    });
  });

  test('protects the last primary image for published products in the UI', () => {
    assert.equal(
      canDeleteAdminProductMedia('PUBLISHED', media('PRODUCT'), [media('PRODUCT')]),
      false,
    );
    assert.equal(
      canDeleteAdminProductMedia('PUBLISHED', media('PRODUCT'), [
        media('PRODUCT'),
        { ...media('PRODUCT'), id: 'PRODUCT-2' },
      ]),
      true,
    );
    assert.equal(
      canDeleteAdminProductMedia('PUBLISHED', media('DETAIL'), [media('PRODUCT')]),
      true,
    );
    assert.equal(canDeleteAdminProductMedia('DRAFT', media('PRODUCT'), [media('PRODUCT')]), true);
  });

  test('requires a non-zero inventory delta and an auditable reason', () => {
    assert.deepEqual(validateInventoryAdjustment('3', 'رسید انبار'), []);
    assert.equal(validateInventoryAdjustment('0', '').length, 2);
    assert.ok(validateInventoryAdjustment('-2', '   ').includes('دلیل تغییر موجودی را وارد کنید.'));
  });

  test('retains URL fallback while validating direct image uploads', () => {
    assert.deepEqual(validateMediaDraft('https://cdn.example/product.webp', 'نمای روبه‌رو'), []);
    assert.equal(validateMediaDraft('', '').length, 2);
    assert.deepEqual(validateCatalogMediaFile({ type: 'image/png', size: 100 } as File), []);
  });

  test('prioritizes saving, publish blockers, invalid, saved, and draft state decisions', () => {
    assert.equal(
      resolveAdminMutationState({
        isDirty: true,
        isPending: true,
        isError: false,
        isSuccess: false,
        hasInvalidFields: true,
        hasPublishBlockers: true,
      }),
      'saving',
    );
    assert.equal(
      resolveAdminMutationState({
        isDirty: true,
        isPending: false,
        isError: false,
        isSuccess: false,
        hasInvalidFields: false,
        hasPublishBlockers: true,
      }),
      'publish-blocked',
    );
    assert.equal(
      resolveAdminMutationState({
        isDirty: true,
        isPending: false,
        isError: true,
        isSuccess: false,
        hasInvalidFields: false,
      }),
      'invalid',
    );
    assert.equal(
      resolveAdminMutationState({
        isDirty: false,
        isPending: false,
        isError: false,
        isSuccess: true,
        hasInvalidFields: false,
      }),
      'saved',
    );
    assert.equal(
      resolveAdminMutationState({
        isDirty: true,
        isPending: false,
        isError: false,
        isSuccess: false,
        hasInvalidFields: false,
      }),
      'draft',
    );
  });

  test('flags an inventory discrepancy only when the stock equation is inconsistent', () => {
    assert.equal(isInventoryDiscrepancy({ onHand: 12, reserved: 3, available: 9 }), false);
    assert.equal(isInventoryDiscrepancy({ onHand: 12, reserved: 3, available: 8 }), true);
  });

  test('keeps selected inventory detail loading and errors visible before data exists', () => {
    assert.equal(
      resolveInventoryDetailState({
        hasItem: false,
        enabled: true,
        isPending: true,
        isError: false,
      }),
      'loading',
    );
    assert.equal(
      resolveInventoryDetailState({
        hasItem: false,
        enabled: true,
        isPending: false,
        isError: true,
      }),
      'error',
    );
    assert.equal(
      resolveInventoryDetailState({
        hasItem: false,
        enabled: true,
        isPending: false,
        isError: false,
      }),
      'empty',
    );
    assert.equal(
      resolveInventoryDetailState({
        hasItem: true,
        enabled: true,
        isPending: false,
        isError: true,
      }),
      'ready',
    );
    assert.equal(
      resolveInventoryDetailState({
        hasItem: false,
        enabled: false,
        isPending: true,
        isError: false,
      }),
      'empty',
    );
  });
});
