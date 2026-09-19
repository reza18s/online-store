import type { CatalogFacetFilters } from '../catalog-api-shared';

import { normalizeFacetFilters } from './normalize-facet-filters';

export function toFacetQueryString(filters: CatalogFacetFilters): string {
  const params = new URLSearchParams();
  const normalized = normalizeFacetFilters(filters);

  for (const [key, value] of Object.entries(normalized)) {
    if (value === undefined || value === '') continue;
    params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}
