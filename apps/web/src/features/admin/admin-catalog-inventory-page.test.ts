import { describe, expect, test } from 'bun:test';

import {
  hasAdminRole,
  isInventoryDiscrepancy,
  normalizeAdminCatalogInventoryView,
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
    expect(normalizeAdminCatalogInventoryView('categories')).toBe('categories');
    expect(normalizeAdminCatalogInventoryView('inventory')).toBe('inventory');
    expect(normalizeAdminCatalogInventoryView('unknown')).toBe('catalog');
  });

  test('keeps mutations visible only for the matching staff roles', () => {
    expect(hasAdminRole(['support'], ['support', 'operations', 'admin'])).toBe(true);
    expect(hasAdminRole(['SUPPORT'], ['admin'])).toBe(false);
    expect(hasAdminRole(['operations'], ['operations', 'admin'])).toBe(true);
    expect(hasAdminRole(undefined, ['admin'])).toBe(false);
  });

  test('validates product identifiers and price ordering', () => {
    expect(validateProductDraft(validProduct)).toEqual([]);
    expect(validateProductDraft({ ...validProduct, slug: 'Not Valid' })).toHaveLength(1);
    expect(validateProductDraft({ ...validProduct, compareAtPriceToman: '120000' })).toContain(
      'قیمت قبل نباید کمتر از قیمت پایه باشد.',
    );
    expect(validateProductDraft({ ...validProduct, slug: 'ignored-for-edit' }, 'edit')).toEqual([]);
  });

  test('requires a non-zero inventory delta and an auditable reason', () => {
    expect(validateInventoryAdjustment('3', 'رسید انبار')).toEqual([]);
    expect(validateInventoryAdjustment('0', '')).toHaveLength(2);
    expect(validateInventoryAdjustment('-2', '   ')).toContain('دلیل تغییر موجودی را وارد کنید.');
  });

  test('treats media URL and alt text as the supported upload boundary', () => {
    expect(validateMediaDraft('https://cdn.example/product.webp', 'نمای روبه‌رو')).toEqual([]);
    expect(validateMediaDraft('', '')).toHaveLength(2);
  });

  test('prioritizes saving, publish blockers, invalid, saved, and draft state decisions', () => {
    expect(
      resolveAdminMutationState({
        isDirty: true,
        isPending: true,
        isError: false,
        isSuccess: false,
        hasInvalidFields: true,
        hasPublishBlockers: true,
      }),
    ).toBe('saving');
    expect(
      resolveAdminMutationState({
        isDirty: true,
        isPending: false,
        isError: false,
        isSuccess: false,
        hasInvalidFields: false,
        hasPublishBlockers: true,
      }),
    ).toBe('publish-blocked');
    expect(
      resolveAdminMutationState({
        isDirty: true,
        isPending: false,
        isError: true,
        isSuccess: false,
        hasInvalidFields: false,
      }),
    ).toBe('invalid');
    expect(
      resolveAdminMutationState({
        isDirty: false,
        isPending: false,
        isError: false,
        isSuccess: true,
        hasInvalidFields: false,
      }),
    ).toBe('saved');
    expect(
      resolveAdminMutationState({
        isDirty: true,
        isPending: false,
        isError: false,
        isSuccess: false,
        hasInvalidFields: false,
      }),
    ).toBe('draft');
  });

  test('flags an inventory discrepancy only when the stock equation is inconsistent', () => {
    expect(isInventoryDiscrepancy({ onHand: 12, reserved: 3, available: 9 })).toBe(false);
    expect(isInventoryDiscrepancy({ onHand: 12, reserved: 3, available: 8 })).toBe(true);
  });
});
