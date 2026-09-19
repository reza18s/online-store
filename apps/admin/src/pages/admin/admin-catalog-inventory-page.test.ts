import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  adminInventoryViewKey,
  adminProductEditorKey,
  hasAdminRole,
  isInventoryDiscrepancy,
  normalizeAdminCatalogInventoryView,
  resolveInventoryDetailState,
  resolveAdminMutationState,
  validateInventoryAdjustment,
  validateMediaDraft,
  validateProductDraft,
} from './admin-catalog-inventory-page';

const validProduct = {
  slug: 'linen-overshirt',
  name: 'پیراهن لینن',
  shortDescription: '',
  description: '',
  brand: '',
  basePriceToman: '240000',
  compareAtPriceToman: '280000',
};

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

  test('requires a non-zero inventory delta and an auditable reason', () => {
    assert.deepEqual(validateInventoryAdjustment('3', 'رسید انبار'), []);
    assert.equal(validateInventoryAdjustment('0', '').length, 2);
    assert.ok(validateInventoryAdjustment('-2', '   ').includes('دلیل تغییر موجودی را وارد کنید.'));
  });

  test('treats media URL and alt text as the supported upload boundary', () => {
    assert.deepEqual(validateMediaDraft('https://cdn.example/product.webp', 'نمای روبه‌رو'), []);
    assert.equal(validateMediaDraft('', '').length, 2);
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
