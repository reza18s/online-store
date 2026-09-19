import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { createAdminContentPage } from './create-admin-content-page';

import { invalidateContentQueries } from '../../../lib/content/content-api-functions/invalidate-content-queries';

export function useCreateAdminContentPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminContent.all,
    mutationFn: createAdminContentPage,
    onSuccess: () => invalidateContentQueries(queryClient),
  });
}
