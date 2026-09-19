import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import type { CatalogFacetFilters } from '../catalog-api-shared';

import { fetchCatalogFacets } from './fetch-catalog-facets';

import { normalizeFacetFilters } from './normalize-facet-filters';

export function useCatalogFacets(filters: CatalogFacetFilters = {}, enabled = true) {
  const normalized = normalizeFacetFilters(filters);

  return useQuery({
    queryKey: queryKeys.catalog.facets(normalized),
    queryFn: () => fetchCatalogFacets(normalized),
    enabled,
    staleTime: 30_000,
  });
}
