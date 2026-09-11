import type { QueryClient } from '@tanstack/react-query';

export function isAdminQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === 'admin';
}

export function isStaffCurrentQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey.length === 2 && queryKey[0] === 'staff-auth' && queryKey[1] === 'current';
}

export function clearStaffSessionCache(queryClient: QueryClient): void {
  queryClient.removeQueries({
    predicate: ({ queryKey }) => isAdminQueryKey(queryKey) || isStaffCurrentQueryKey(queryKey),
  });
}
