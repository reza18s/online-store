import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { deleteAdminSeoMetadata } from './delete-admin-seo-metadata';

export function useDeleteAdminSeoMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminContent.all,
    mutationFn: deleteAdminSeoMetadata,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.seo.all });
    },
  });
}
