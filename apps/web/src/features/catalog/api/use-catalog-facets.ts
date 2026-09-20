import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import type { CatalogFacetFilters } from '@/features/catalog/api/catalog-api-shared';

import { fetchCatalogFacets } from '@/features/catalog/api/fetch-catalog-facets';

import { normalizeFacetFilters } from '@/features/catalog/api/normalize-facet-filters';

export function useCatalogFacets(filters: CatalogFacetFilters = {}, enabled = true) {
  const normalized = normalizeFacetFilters(filters);

  return useQuery({
    queryKey: queryKeys.catalog.facets(normalized),
    queryFn: () => fetchCatalogFacets(normalized),
    enabled,
    staleTime: 30_000,
  });
}
