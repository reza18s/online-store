import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminCatalogProductMediaCreateInput } from '@nova/api-client';

import { createAdminProductMedia } from './create-admin-product-media';

import { invalidateAdminProductResources } from './invalidate-admin-product-resources';

export function useCreateAdminProductMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: AdminCatalogProductMediaCreateInput;
    }) => createAdminProductMedia(productId, input),
    onSuccess: (_media, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}
