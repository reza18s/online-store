import type { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { invalidateAdminProductList } from './invalidate-admin-product-list';

export function invalidateAdminProductResources(
  queryClient: ReturnType<typeof useQueryClient>,
  productId: string,
): Promise<void[]> {
  return Promise.all([
    invalidateAdminProductList(queryClient),
    queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog.product(productId) }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.adminCatalog.productCategories(productId),
    }),
    queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog.productOptions(productId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog.productVariants(productId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog.productMedia(productId) }),
  ]);
}
