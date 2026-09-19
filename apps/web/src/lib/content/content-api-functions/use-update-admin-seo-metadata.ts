import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminSeoMetadataUpdateInput } from '@nova/api-client';

import { updateAdminSeoMetadata } from './update-admin-seo-metadata';

export function useUpdateAdminSeoMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminContent.all,
    mutationFn: ({
      metadataId,
      input,
    }: {
      metadataId: string;
      input: AdminSeoMetadataUpdateInput;
    }) => updateAdminSeoMetadata(metadataId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.seo.all });
    },
  });
}
