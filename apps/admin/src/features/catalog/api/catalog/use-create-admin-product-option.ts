import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminCatalogProductOptionCreateInput } from '@nova/api-client';

import { createAdminProductOption } from '@/features/catalog/api/catalog/create-admin-product-option';

import { invalidateAdminProductResources } from '@/features/catalog/api/catalog/invalidate-admin-product-resources';

export function useCreateAdminProductOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: AdminCatalogProductOptionCreateInput;
    }) => createAdminProductOption(productId, input),
    onSuccess: (_option, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}
