import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { createAdminSeoMetadata } from './create-admin-seo-metadata';

export function useCreateAdminSeoMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminContent.all,
    mutationFn: createAdminSeoMetadata,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.seo.all });
    },
  });
}
