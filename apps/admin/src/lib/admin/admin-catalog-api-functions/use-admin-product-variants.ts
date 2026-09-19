import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchAdminProductVariants } from './fetch-admin-product-variants';

export function useAdminProductVariants(productId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminCatalog.productVariants(productId),
    queryFn: () => fetchAdminProductVariants(productId),
    enabled: enabled && Boolean(productId),
    staleTime: 15_000,
  });
}
