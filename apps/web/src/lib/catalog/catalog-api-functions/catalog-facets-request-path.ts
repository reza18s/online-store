import type { CatalogFacetFilters } from '../catalog-api-shared';
import { catalogFacetsPath } from '../catalog-api-shared';

import { normalizeFacetFilters } from './normalize-facet-filters';

import { toFacetQueryString } from './to-facet-query-string';

export function catalogFacetsRequestPath(filters: CatalogFacetFilters = {}): string {
  const normalized = normalizeFacetFilters(filters);
  return `${catalogFacetsPath}${toFacetQueryString(normalized)}`;
}
