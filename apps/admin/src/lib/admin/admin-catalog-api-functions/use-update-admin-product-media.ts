import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminCatalogProductMediaUpdateInput } from '@nova/api-client';

import { invalidateAdminProductResources } from './invalidate-admin-product-resources';

import { updateAdminProductMedia } from './update-admin-product-media';

export function useUpdateAdminProductMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      mediaId,
      input,
    }: {
      productId: string;
      mediaId: string;
      input: AdminCatalogProductMediaUpdateInput;
    }) => updateAdminProductMedia(productId, mediaId, input),
    onSuccess: (_media, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}
