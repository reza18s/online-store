import type { CatalogFacetFilters } from '@/features/catalog/api/catalog-api-shared';
import { catalogFacetsPath } from '@/features/catalog/api/catalog-api-shared';

import { normalizeFacetFilters } from '@/features/catalog/api/normalize-facet-filters';

import { toFacetQueryString } from '@/features/catalog/api/to-facet-query-string';

export function catalogFacetsRequestPath(filters: CatalogFacetFilters = {}): string {
  const normalized = normalizeFacetFilters(filters);
  return `${catalogFacetsPath}${toFacetQueryString(normalized)}`;
}
