import type { CatalogAudience } from '@nova/api-client';

import { type CatalogFilters } from '../../../lib/catalog/catalog-api';

import type { DiscoveryQueryState } from '../../../pages/catalog/storefront-discovery-page-shared';

export function discoveryFiltersFromQuery(
  state: DiscoveryQueryState,
  audience?: CatalogAudience,
): CatalogFilters {
  return {
    q: state.q || undefined,
    category: state.category || undefined,
    audience,
    size: state.size || undefined,
    color: state.color || undefined,
    material: state.material || undefined,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    inStock: state.inStock ? true : undefined,
    onSale: state.onSale ? true : undefined,
    sort: state.sort,
    page: state.page,
    limit: 8,
  };
}
