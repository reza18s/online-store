import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminCatalogProductCategoryInput } from '@nova/api-client';

import { invalidateAdminProductResources } from './invalidate-admin-product-resources';

import { replaceAdminProductCategories } from './replace-admin-product-categories';

export function useReplaceAdminProductCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: AdminCatalogProductCategoryInput;
    }) => replaceAdminProductCategories(productId, input),
    onSuccess: (_categories, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}
