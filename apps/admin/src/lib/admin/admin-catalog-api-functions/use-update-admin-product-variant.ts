import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminCatalogProductVariantUpdateInput } from '@nova/api-client';

import { invalidateAdminProductResources } from './invalidate-admin-product-resources';

import { updateAdminProductVariant } from './update-admin-product-variant';

export function useUpdateAdminProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      variantId,
      input,
    }: {
      productId: string;
      variantId: string;
      input: AdminCatalogProductVariantUpdateInput;
    }) => updateAdminProductVariant(productId, variantId, input),
    onSuccess: (_variant, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}
