import type { QueryClient } from '@tanstack/react-query';

import { clearStaffSessionCache } from '@/features/auth/api/clear-staff-session-cache';

import { isStaffAuthFailure } from '@/features/auth/api/is-staff-auth-failure';
import { isStaffCurrentQueryKey } from '@/features/auth/api/is-staff-current-query-key';

export function handleStaffSessionFailure(
  queryClient: QueryClient,
  error: unknown,
  failedQueryKey?: readonly unknown[],
): boolean {
  if (!isStaffAuthFailure(error)) return false;

  const currentStaffQueryFailed = Boolean(failedQueryKey && isStaffCurrentQueryKey(failedQueryKey));
  clearStaffSessionCache(queryClient, { preserveCurrentStaffQuery: currentStaffQueryFailed });
  if (currentStaffQueryFailed) {
    for (const query of queryClient.getQueryCache().findAll({
      predicate: ({ queryKey }) => isStaffCurrentQueryKey(queryKey),
    })) {
      query.setState({
        ...query.state,
        data: undefined,
        dataUpdatedAt: 0,
        status: 'error',
        error: error instanceof Error ? error : new Error('Staff authentication failed.'),
        fetchStatus: 'idle',
      });
    }
  }
  return true;
}
