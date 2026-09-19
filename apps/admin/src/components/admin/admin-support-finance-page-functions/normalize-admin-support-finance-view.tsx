import type { AdminSupportFinanceView } from '../../../pages/admin/admin-support-finance-page-shared';

export function normalizeAdminSupportFinanceView(value?: string): AdminSupportFinanceView {
  if (value === 'customers' || value === 'notifications' || value === 'audit') return value;
  return 'payments';
}
