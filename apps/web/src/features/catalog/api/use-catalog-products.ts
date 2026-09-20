import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import type { CatalogFilters } from '@/features/catalog/api/catalog-api-shared';

import { fetchCatalogProducts } from '@/features/catalog/api/fetch-catalog-products';

import { normalizeFilters } from '@/features/catalog/api/normalize-filters';

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
