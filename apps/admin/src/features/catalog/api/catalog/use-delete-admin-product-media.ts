import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { deleteAdminProductMedia } from '@/features/catalog/api/catalog/delete-admin-product-media';

import { invalidateAdminProductResources } from '@/features/catalog/api/catalog/invalidate-admin-product-resources';

export function useDeleteAdminProductMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({ productId, mediaId }: { productId: string; mediaId: string }) =>
      deleteAdminProductMedia(productId, mediaId),
    onSuccess: (_result, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}
