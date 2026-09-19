import type { CatalogFilters } from '../catalog-api-shared';

import { normalizeFilters } from './normalize-filters';

export function toQueryString(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  const normalized = normalizeFilters(filters);

  for (const [key, value] of Object.entries(normalized)) {
    if (value === undefined || value === '') continue;
    params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}
