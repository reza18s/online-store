import type { QueryClient } from '@tanstack/react-query';

import { isAdminQueryKey } from '@/features/auth/api/is-admin-query-key';

import { isStaffCurrentQueryKey } from '@/features/auth/api/is-staff-current-query-key';

import { isStaffProtectedMutationKey } from '@/features/auth/api/is-staff-protected-mutation-key';

export function clearStaffSessionCache(queryClient: QueryClient): void {
  queryClient.removeQueries({
    predicate: ({ queryKey }) => isAdminQueryKey(queryKey) || isStaffCurrentQueryKey(queryKey),
  });

  const mutationCache = queryClient.getMutationCache();
  for (const mutation of mutationCache.findAll({
    predicate: ({ options }) => isStaffProtectedMutationKey(options.mutationKey),
  })) {
    mutationCache.remove(mutation);
  }
}
