import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { createAdminCatalogProduct } from './create-admin-catalog-product';

import { invalidateAdminProductList } from './invalidate-admin-product-list';

export function useCreateAdminCatalogProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: createAdminCatalogProduct,
    onSuccess: () => invalidateAdminProductList(queryClient),
  });
}
