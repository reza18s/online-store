import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiClientError } from '@nova/api-client';

import {
  adminOrderErrorMessage,
  adminOrderStatusLabel,
  adminOrderStatusTone,
  hasAdminStaffRole,
  isSafeTrackingReference,
  normalizeTrackingReference,
} from './admin-orders-page';

test('keeps the complete operational status vocabulary presentationally stable', () => {
  assert.equal(adminOrderStatusLabel('PREPARING'), 'در حال آماده‌سازی');
  assert.equal(adminOrderStatusLabel('DELAYED'), 'با تأخیر');
  assert.equal(adminOrderStatusLabel('EXCEPTION'), 'نیازمند پیگیری');
  assert.equal(adminOrderStatusLabel('RETURNED'), 'مرجوع شده');
  assert.equal(adminOrderStatusTone('CANCELLED'), 'danger');
  assert.equal(adminOrderStatusTone('DELIVERED'), 'success');
});

test('allows only the staff roles that own the corresponding operations', () => {
  assert.equal(hasAdminStaffRole(['support']), true);
  assert.equal(hasAdminStaffRole(['support'], 'operations'), false);
  assert.equal(hasAdminStaffRole(['operations'], 'operations'), true);
  assert.equal(hasAdminStaffRole(['ADMIN'], 'admin'), true);
  assert.equal(hasAdminStaffRole(undefined), false);
});

test('normalizes and validates tracking identifiers without creating redirect targets', () => {
  assert.equal(normalizeTrackingReference('  TRK-2026-001  '), 'TRK-2026-001');
  assert.equal(normalizeTrackingReference('   '), null);
  assert.equal(isSafeTrackingReference('TRK-2026.001:AB'), true);
  assert.equal(isSafeTrackingReference('https://provider.example/track/1'), false);
  assert.equal(isSafeTrackingReference('<script>alert(1)</script>'), false);
});

test('maps authorization and optimistic-concurrency failures to stable staff copy', () => {
  assert.match(adminOrderErrorMessage(new ApiClientError(409), 'fallback'), /هم‌زمان تغییر کرده/);
  assert.equal(
    adminOrderErrorMessage(new ApiClientError(403), 'fallback'),
    'شما اجازه انجام این عملیات را ندارید.',
  );
});
