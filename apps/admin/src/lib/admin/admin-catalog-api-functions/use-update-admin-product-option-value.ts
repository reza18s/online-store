import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminCatalogProductOptionValueUpdateInput } from '@nova/api-client';

import { invalidateAdminProductResources } from './invalidate-admin-product-resources';

import { updateAdminProductOptionValue } from './update-admin-product-option-value';

export function useUpdateAdminProductOptionValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      optionId,
      valueId,
      input,
    }: {
      productId: string;
      optionId: string;
      valueId: string;
      input: AdminCatalogProductOptionValueUpdateInput;
    }) => updateAdminProductOptionValue(productId, optionId, valueId, input),
    onSuccess: (_value, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}
