import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminCatalogProductOptionUpdateInput } from '@nova/api-client';

import { invalidateAdminProductResources } from './invalidate-admin-product-resources';

import { updateAdminProductOption } from './update-admin-product-option';

export function useUpdateAdminProductOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      optionId,
      input,
    }: {
      productId: string;
      optionId: string;
      input: AdminCatalogProductOptionUpdateInput;
    }) => updateAdminProductOption(productId, optionId, input),
    onSuccess: (_option, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}
