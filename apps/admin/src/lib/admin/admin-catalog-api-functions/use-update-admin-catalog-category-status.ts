import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminCatalogCategoryStatusInput } from '@nova/api-client';

import { updateAdminCatalogCategoryStatus } from './update-admin-catalog-category-status';

export function useUpdateAdminCatalogCategoryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      categoryId,
      input,
    }: {
      categoryId: string;
      input: AdminCatalogCategoryStatusInput;
    }) => updateAdminCatalogCategoryStatus(categoryId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog.categories() }),
  });
}
