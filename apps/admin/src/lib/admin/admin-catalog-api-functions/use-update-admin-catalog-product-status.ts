import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminCatalogProductStatusInput } from '@nova/api-client';

import { invalidateAdminProductResources } from './invalidate-admin-product-resources';

import { updateAdminCatalogProductStatus } from './update-admin-catalog-product-status';

export function useUpdateAdminCatalogProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: AdminCatalogProductStatusInput;
    }) => updateAdminCatalogProductStatus(productId, input),
    onSuccess: (_product, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}
