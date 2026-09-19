import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminCatalogProductVariantCreateInput } from '@nova/api-client';

import { createAdminProductVariant } from './create-admin-product-variant';

import { invalidateAdminProductResources } from './invalidate-admin-product-resources';

export function useCreateAdminProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: AdminCatalogProductVariantCreateInput;
    }) => createAdminProductVariant(productId, input),
    onSuccess: (_variant, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}
