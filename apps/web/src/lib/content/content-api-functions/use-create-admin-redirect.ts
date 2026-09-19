import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { createAdminRedirect } from './create-admin-redirect';

export function useCreateAdminRedirect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminContent.all,
    mutationFn: createAdminRedirect,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.seo.all });
    },
  });
}
