import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  adminCustomerLookupHref,
  adminCustomerLookupQuery,
  adminOrderHref,
  canStaffInspectView,
  normalizeAdminSupportFinanceView,
  pageCount,
  PAYMENT_STATUSES,
  safeAuditMetadataLabel,
} from './admin-support-finance-page';

test('normalizes unknown admin inspection views to the safe payment landing view', () => {
  assert.equal(normalizeAdminSupportFinanceView('customers'), 'customers');
  assert.equal(normalizeAdminSupportFinanceView('audit'), 'audit');
  assert.equal(normalizeAdminSupportFinanceView('not-a-view'), 'payments');
  assert.equal(normalizeAdminSupportFinanceView(undefined), 'payments');
});

test('enforces the server-aligned role matrix before rendering a panel', () => {
  assert.equal(canStaffInspectView('customers', ['support']), true);
  assert.equal(canStaffInspectView('notifications', ['support']), false);
  assert.equal(canStaffInspectView('notifications', ['operations']), true);
  assert.equal(canStaffInspectView('payments', ['operations', 'support']), false);
  assert.equal(canStaffInspectView('audit', ['admin']), true);
});

test('keeps the payment status filter aligned with the payment inspection contract', () => {
  assert.deepEqual(PAYMENT_STATUSES, [
    'PENDING',
    'REDIRECTED',
    'SUCCEEDED',
    'FAILED',
    'EXPIRED',
    'CANCELLED',
  ]);
});

test('keeps pagination bounded and always exposes a valid page count', () => {
  assert.equal(pageCount(0, 12), 1);
  assert.equal(pageCount(25, 12), 3);
  assert.equal(pageCount(100, 0), 1);
  assert.equal(pageCount(Number.NaN, 12), 1);
});

test('encodes operational cross-links instead of interpolating identifiers', () => {
  assert.equal(adminOrderHref('NV/1405 2481'), '#admin/orders/NV%2F1405%202481');
  assert.equal(
    adminCustomerLookupHref('person+support@example.test'),
    '#admin/customers?q=person%2Bsupport%40example.test',
  );
});

test('restores an encoded customer lookup into the customer filter', () => {
  assert.equal(
    adminCustomerLookupQuery('q=person%2Bsupport%40example.test'),
    'person+support@example.test',
  );
  assert.equal(adminCustomerLookupQuery('status=ACTIVE'), '');
});

test('summarizes audit metadata without rendering the payload', () => {
  const secretPayload = { callbackUrl: 'https://gateway.invalid/secret', otp: '123456' };
  assert.equal(safeAuditMetadataLabel(secretPayload), 'جزئیات رویداد در این نما محدود شده است');
  assert.equal(safeAuditMetadataLabel(null), 'جزئیات محدودشده‌ای ثبت نشده');
});
