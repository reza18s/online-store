import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchAdminProductMedia } from './fetch-admin-product-media';

export function useAdminProductMedia(productId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminCatalog.productMedia(productId),
    queryFn: () => fetchAdminProductMedia(productId),
    enabled: enabled && Boolean(productId),
    staleTime: 30_000,
  });
}
