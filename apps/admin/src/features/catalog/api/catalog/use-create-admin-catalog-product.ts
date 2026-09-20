import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { createAdminCatalogProduct } from '@/features/catalog/api/catalog/create-admin-catalog-product';

import { invalidateAdminProductList } from '@/features/catalog/api/catalog/invalidate-admin-product-list';

export function useCreateAdminCatalogProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: createAdminCatalogProduct,
    onSuccess: () => invalidateAdminProductList(queryClient),
  });
}
