import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchCatalogProduct } from './fetch-catalog-product';

export function useCatalogProduct(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.catalog.product(slug),
    queryFn: () => fetchCatalogProduct(slug),
    enabled: enabled && Boolean(slug),
    staleTime: 60_000,
  });
}
