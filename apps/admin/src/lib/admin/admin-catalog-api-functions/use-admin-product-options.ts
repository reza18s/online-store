import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchAdminProductOptions } from './fetch-admin-product-options';

export function useAdminProductOptions(productId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminCatalog.productOptions(productId),
    queryFn: () => fetchAdminProductOptions(productId),
    enabled: enabled && Boolean(productId),
    staleTime: 30_000,
  });
}
