import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getAdminMobileNavigation, getAdminWorkspaceNavigation } from '@/app/layouts/AdminWorkspaceLayout';

function keys(items: Array<{ key: string }>): string[] {
  return items.map((item) => item.key);
}

test('filters global staff navigation by support, operations, and admin permissions', () => {
  assert.deepEqual(keys(getAdminWorkspaceNavigation(['support'])), [
    'catalog',
    'catalog/categories',
    'orders',
    'customers',
  ]);
  assert.deepEqual(keys(getAdminWorkspaceNavigation(['operations'])), [
    'catalog',
    'catalog/categories',
    'orders',
    'customers',
    'notifications',
    'inventory',
  ]);
  assert.deepEqual(keys(getAdminWorkspaceNavigation(['ADMIN'])), [
    'admin',
    'catalog',
    'catalog/categories',
    'orders',
    'customers',
    'payments',
    'content',
    'audit',
    'notifications',
    'inventory',
  ]);
});

test('applies the same permission filter to mobile navigation', () => {
  assert.deepEqual(keys(getAdminMobileNavigation(['support'])), ['orders', 'catalog']);
  assert.deepEqual(keys(getAdminMobileNavigation(['operations'])), [
    'orders',
    'catalog',
    'inventory',
  ]);
  assert.deepEqual(keys(getAdminWorkspaceNavigation(undefined)), []);
});
