import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { createAdminContentPage } from '@/features/content/api/content-pages/create-admin-content-page';

import { invalidateContentQueries } from '@/features/content/api/invalidate-content-queries';

export function useCreateAdminContentPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminContent.all,
    mutationFn: createAdminContentPage,
    onSuccess: () => invalidateContentQueries(queryClient),
  });
}
