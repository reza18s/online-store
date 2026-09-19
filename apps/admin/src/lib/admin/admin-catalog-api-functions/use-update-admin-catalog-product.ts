import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminCatalogProductUpdateInput } from '@nova/api-client';

import { invalidateAdminProductResources } from './invalidate-admin-product-resources';

import { updateAdminCatalogProduct } from './update-admin-catalog-product';

export function useUpdateAdminCatalogProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: AdminCatalogProductUpdateInput;
    }) => updateAdminCatalogProduct(productId, input),
    onSuccess: (_product, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}
