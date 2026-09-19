import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchAdminContentPage } from './fetch-admin-content-page';

export function useAdminContentPage(pageId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminContent.page(pageId),
    queryFn: () => fetchAdminContentPage(pageId),
    enabled: enabled && Boolean(pageId),
    staleTime: 15_000,
  });
}
