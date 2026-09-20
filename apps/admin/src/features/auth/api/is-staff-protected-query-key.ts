import { isAdminQueryKey } from '@/features/auth/api/is-admin-query-key';

import { isStaffCurrentQueryKey } from '@/features/auth/api/is-staff-current-query-key';

export function isStaffProtectedQueryKey(queryKey: readonly unknown[]): boolean {
  return isAdminQueryKey(queryKey) || isStaffCurrentQueryKey(queryKey);
}
