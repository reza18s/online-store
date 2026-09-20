import type { AdminSupportFinanceView } from '@/features/support/pages/admin-support-finance-page-shared';
import { VIEW_ACCESS } from '@/features/support/pages/admin-support-finance-page-shared';

export function canStaffInspectView(
  view: AdminSupportFinanceView,
  roles: readonly string[],
): boolean {
  const normalizedRoles = new Set(roles.map((role) => role.toLowerCase()));
  return VIEW_ACCESS[view].roles.some((role) => normalizedRoles.has(role));
}
