import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchCatalogCategories } from './fetch-catalog-categories';

export function useCatalogCategories(enabled = true) {
  return useQuery({
    queryKey: queryKeys.catalog.categories(),
    queryFn: fetchCatalogCategories,
    enabled,
    staleTime: 5 * 60_000,
  });
}
