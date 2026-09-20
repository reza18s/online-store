import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchCurrentCustomer } from '@/features/auth/api/fetch-current-customer';

export function useCurrentCustomer(enabled = true) {
  return useQuery({
    queryKey: queryKeys.account.current(),
    queryFn: fetchCurrentCustomer,
    enabled,
    retry: false,
    staleTime: 30_000,
  });
}
