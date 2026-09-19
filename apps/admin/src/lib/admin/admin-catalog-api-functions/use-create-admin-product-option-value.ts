import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminCatalogProductOptionValueCreateInput } from '@nova/api-client';

import { createAdminProductOptionValue } from './create-admin-product-option-value';

import { invalidateAdminProductResources } from './invalidate-admin-product-resources';

export function useCreateAdminProductOptionValue() {
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
      input: AdminCatalogProductOptionValueCreateInput;
    }) => createAdminProductOptionValue(productId, optionId, input),
    onSuccess: (_value, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}
