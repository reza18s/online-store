import type { CatalogFilters } from '../catalog-api-shared';

import { normalizeFilters } from './normalize-filters';

import { toQueryString } from './to-query-string';

export function catalogRequestPath(filters: CatalogFilters = {}): string {
  const normalized = normalizeFilters(filters);
  const endpoint = normalized.q ? '/v1/search' : '/v1/catalog/products';
  return `${endpoint}${toQueryString(normalized)}`;
}
