import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getAdminMobileNavigation, getAdminWorkspaceNavigation } from '@/app/layouts/AdminWorkspaceLayout';

function keys(items: Array<{ key: string }>): string[] {
  return items.map((item) => item.key);
}

test('filters global staff navigation by support, operations, and admin permissions', () => {
  assert.deepEqual(keys(getAdminWorkspaceNavigation(['support'], false)), [
    'catalog',
    'catalog/categories',
    'orders',
    'customers',
  ]);
  assert.deepEqual(keys(getAdminWorkspaceNavigation(['operations'], false)), [
    'catalog',
    'catalog/categories',
    'orders',
    'customers',
    'operations',
  ]);
  assert.deepEqual(keys(getAdminWorkspaceNavigation(['ADMIN'], false)), [
    'admin',
    'catalog',
    'catalog/categories',
    'orders',
    'customers',
    'marketing',
    'content',
    'audit',
    'promotions',
    'operations',
  ]);
});

test('applies the same permission filter to mobile navigation and keeps the dev preview usable', () => {
  assert.deepEqual(keys(getAdminMobileNavigation(['support'], false)), ['catalog', 'orders']);
  assert.deepEqual(keys(getAdminMobileNavigation(['operations'], false)), [
    'catalog',
    'orders',
    'operations',
  ]);
  assert.deepEqual(keys(getAdminWorkspaceNavigation(undefined, true)), [
    'admin',
    'catalog',
    'catalog/categories',
    'orders',
    'customers',
    'marketing',
    'content',
    'audit',
    'promotions',
    'operations',
  ]);
});
