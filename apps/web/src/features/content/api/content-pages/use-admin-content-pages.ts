import { useQuery } from '@tanstack/react-query';
import { queryKeys, type AdminContentPageListQuery } from '@nova/api-client';

import { fetchAdminContentPages } from '@/features/content/api/content-pages/fetch-admin-content-pages';

export function useAdminContentPages(query: AdminContentPageListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminContent.pages(query),
    queryFn: () => fetchAdminContentPages(query),
    enabled,
    staleTime: 15_000,
  });
}
