import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchAdminCatalogCategories } from './fetch-admin-catalog-categories';

export function useAdminCatalogCategories(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminCatalog.categories(),
    queryFn: fetchAdminCatalogCategories,
    enabled,
    staleTime: 60_000,
  });
}
