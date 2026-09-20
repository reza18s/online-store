import type { AdminSupportFinanceView } from '@/features/support/pages/admin-support-finance-page-shared';

export function normalizeAdminSupportFinanceView(value?: string): AdminSupportFinanceView {
  if (value === 'customers' || value === 'notifications' || value === 'audit') return value;
  return 'payments';
}
