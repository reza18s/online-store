import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminCatalogCategoryUpdateInput } from '@nova/api-client';

import { updateAdminCatalogCategory } from './update-admin-catalog-category';

export function useUpdateAdminCatalogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      categoryId,
      input,
    }: {
      categoryId: string;
      input: AdminCatalogCategoryUpdateInput;
    }) => updateAdminCatalogCategory(categoryId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog.categories() }),
  });
}
