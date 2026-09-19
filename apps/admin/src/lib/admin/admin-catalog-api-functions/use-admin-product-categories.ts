import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchAdminProductCategories } from './fetch-admin-product-categories';

export function useAdminProductCategories(productId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminCatalog.productCategories(productId),
    queryFn: () => fetchAdminProductCategories(productId),
    enabled: enabled && Boolean(productId),
    staleTime: 30_000,
  });
}
