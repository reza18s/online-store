import { useQuery } from '@tanstack/react-query';
import { queryKeys, type AdminRedirectListQuery } from '@nova/api-client';

import { fetchAdminRedirects } from './fetch-admin-redirects';

export function useAdminRedirects(query: AdminRedirectListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminContent.redirects(query),
    queryFn: () => fetchAdminRedirects(query),
    enabled,
    staleTime: 15_000,
  });
}
