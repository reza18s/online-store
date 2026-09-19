import { isAdminQueryKey } from './is-admin-query-key';

import { isStaffCurrentQueryKey } from './is-staff-current-query-key';

export function isStaffProtectedQueryKey(queryKey: readonly unknown[]): boolean {
  return isAdminQueryKey(queryKey) || isStaffCurrentQueryKey(queryKey);
}
