import type { CatalogAudience } from '@nova/api-client';

import { type CatalogFacetFilters } from '../../../lib/catalog/catalog-api';

import type { DiscoveryQueryState } from '../../../pages/catalog/storefront-discovery-page-shared';

import { discoveryFiltersFromQuery } from './discovery-filters-from-query';

export function discoveryFacetFiltersFromQuery(
  state: DiscoveryQueryState,
  audience?: CatalogAudience,
): CatalogFacetFilters {
  const filters = discoveryFiltersFromQuery(state, audience);
  return Object.fromEntries(
    Object.entries(filters).filter(([key]) => key !== 'sort' && key !== 'page' && key !== 'limit'),
  ) as CatalogFacetFilters;
}
