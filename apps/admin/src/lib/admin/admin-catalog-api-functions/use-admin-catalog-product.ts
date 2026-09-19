import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchAdminCatalogProduct } from './fetch-admin-catalog-product';

export function useAdminCatalogProduct(productId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminCatalog.product(productId),
    queryFn: () => fetchAdminCatalogProduct(productId),
    enabled: enabled && Boolean(productId),
    staleTime: 15_000,
  });
}
