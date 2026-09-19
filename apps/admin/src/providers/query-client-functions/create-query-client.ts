import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import {
  handleStaffSessionFailure,
  isStaffProtectedMutationKey,
  isStaffProtectedQueryKey,
} from '../../lib/admin/admin-auth';
import { redirectToStaffLogin } from './redirect-to-staff-login';

export function createQueryClient(
  options: { isDevelopment?: boolean; onStaffSessionExpired?: () => void } = {},
): QueryClient {
  const isDevelopment = options.isDevelopment ?? import.meta.env.DEV;
  const onStaffSessionExpired = options.onStaffSessionExpired ?? redirectToStaffLogin;
  const clearStaffSessionAfterFailure = (error: unknown): boolean => {
    const hasStaffSession = Boolean(queryClient.getQueryData(queryKeys.staffAuth.current()));
    return handleStaffSessionFailure(queryClient, error, { hasStaffSession, isDevelopment });
  };
  const queryCache = new QueryCache({
    onError: (error, query) => {
      if (!isStaffProtectedQueryKey(query.queryKey)) return;
      if (clearStaffSessionAfterFailure(error)) onStaffSessionExpired();
    },
  });
  const mutationCache = new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (!isStaffProtectedMutationKey(mutation.options.mutationKey)) return;
      if (clearStaffSessionAfterFailure(error)) onStaffSessionExpired();
    },
  });
  const queryClient = new QueryClient({
    queryCache,
    mutationCache,
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
  });
  return queryClient;
}
