import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { createAdminCatalogCategory } from './create-admin-catalog-category';

export function useCreateAdminCatalogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: createAdminCatalogCategory,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog.categories() }),
  });
}
