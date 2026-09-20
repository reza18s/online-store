import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminContentPageStatusInput } from '@nova/api-client';

import { invalidateContentQueries } from '@/features/content/api/content/invalidate-content-queries';

import { updateAdminContentPageStatus } from '@/features/content/api/content-pages/update-admin-content-page-status';

export function useUpdateAdminContentPageStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminContent.all,
    mutationFn: ({ pageId, input }: { pageId: string; input: AdminContentPageStatusInput }) =>
      updateAdminContentPageStatus(pageId, input),
    onSuccess: () => invalidateContentQueries(queryClient),
  });
}
