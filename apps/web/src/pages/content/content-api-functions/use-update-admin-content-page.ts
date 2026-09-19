import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminContentPageUpdateInput } from '@nova/api-client';

import { invalidateContentQueries } from '../../../lib/content/content-api-functions/invalidate-content-queries';

import { updateAdminContentPage } from './update-admin-content-page';

export function useUpdateAdminContentPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminContent.all,
    mutationFn: ({ pageId, input }: { pageId: string; input: AdminContentPageUpdateInput }) =>
      updateAdminContentPage(pageId, input),
    onSuccess: () => invalidateContentQueries(queryClient),
  });
}
