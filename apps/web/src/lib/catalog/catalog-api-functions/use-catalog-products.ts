import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import type { CatalogFilters } from '../catalog-api-shared';

import { fetchCatalogProducts } from './fetch-catalog-products';

import { normalizeFilters } from './normalize-filters';

export function useCatalogProducts(filters: CatalogFilters = {}, enabled = true) {
  const normalized = normalizeFilters(filters);

  return useQuery({
    queryKey: normalized.q
      ? queryKeys.catalog.search(normalized)
      : queryKeys.catalog.products(normalized),
    queryFn: () => fetchCatalogProducts(normalized),
    enabled,
    staleTime: 30_000,
  });
}
