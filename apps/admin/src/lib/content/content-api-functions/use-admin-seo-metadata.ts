import { useQuery } from '@tanstack/react-query';
import { queryKeys, type AdminSeoMetadataListQuery } from '@nova/api-client';

import { fetchAdminSeoMetadata } from './fetch-admin-seo-metadata';

export function useAdminSeoMetadata(query: AdminSeoMetadataListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminContent.seoMetadata(query),
    queryFn: () => fetchAdminSeoMetadata(query),
    enabled,
    staleTime: 15_000,
  });
}
