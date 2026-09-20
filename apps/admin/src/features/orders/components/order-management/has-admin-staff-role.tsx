import type { AdminStaffRole } from '@/features/orders/pages/admin-orders-page-shared';

export function hasAdminStaffRole(
  roles: readonly string[] | undefined,
  required: AdminStaffRole | AdminStaffRole[] = ['support', 'operations', 'admin'],
): boolean {
  if (!roles) return false;
  const requiredRoles = Array.isArray(required) ? required : [required];
  const normalized = new Set(roles.map((role) => role.toLowerCase()));
  return requiredRoles.some((role) => normalized.has(role));
}
