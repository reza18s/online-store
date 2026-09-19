import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminRedirectUpdateInput } from '@nova/api-client';

import { updateAdminRedirect } from './update-admin-redirect';

export function useUpdateAdminRedirect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminContent.all,
    mutationFn: ({ redirectId, input }: { redirectId: string; input: AdminRedirectUpdateInput }) =>
      updateAdminRedirect(redirectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.seo.all });
    },
  });
}
