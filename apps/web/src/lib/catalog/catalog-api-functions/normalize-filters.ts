import type { CatalogFilters } from '../catalog-api-shared';

export function normalizeFilters(filters: CatalogFilters): CatalogFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  ) as CatalogFilters;
}
