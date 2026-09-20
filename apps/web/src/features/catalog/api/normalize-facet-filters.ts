import type { CatalogFacetFilters } from '@/features/catalog/api/catalog-api-shared';

export function normalizeFacetFilters(filters: CatalogFacetFilters): CatalogFacetFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  ) as CatalogFacetFilters;
}
