import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import {
  handleStaffSessionFailure,
  isStaffProtectedMutationKey,
  isStaffProtectedQueryKey,
} from '@/features/auth';
import { redirectToStaffLogin } from '@/app/providers/redirect-to-staff-login';

export function createQueryClient(options: { onStaffSessionExpired?: () => void } = {}): QueryClient {
  const onStaffSessionExpired = options.onStaffSessionExpired ?? redirectToStaffLogin;
  const clearStaffSessionAfterFailure = (error: unknown): boolean => {
    return handleStaffSessionFailure(queryClient, error);
  };
  const queryCache = new QueryCache({
    onError: (error, query) => {
      if (!isStaffProtectedQueryKey(query.queryKey)) return;
      if (handleStaffSessionFailure(queryClient, error, query.queryKey)) onStaffSessionExpired();
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
