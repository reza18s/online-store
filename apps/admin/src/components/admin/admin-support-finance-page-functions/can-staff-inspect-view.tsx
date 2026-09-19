import type { AdminSupportFinanceView } from '../../../pages/admin/admin-support-finance-page-shared';
import { VIEW_ACCESS } from '../../../pages/admin/admin-support-finance-page-shared';

export function canStaffInspectView(
  view: AdminSupportFinanceView,
  roles: readonly string[],
): boolean {
  const normalizedRoles = new Set(roles.map((role) => role.toLowerCase()));
  return VIEW_ACCESS[view].roles.some((role) => normalizedRoles.has(role));
}
