import type { CatalogFilters } from '@/features/catalog/api/catalog-api-shared';

import { normalizeFilters } from '@/features/catalog/api/normalize-filters';

import { toQueryString } from '@/features/catalog/api/to-query-string';

export function catalogRequestPath(filters: CatalogFilters = {}): string {
  const normalized = normalizeFilters(filters);
  const endpoint = normalized.q ? '/v1/search' : '/v1/catalog/products';
  return `${endpoint}${toQueryString(normalized)}`;
}
