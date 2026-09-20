import { apiClient, type CatalogFacets } from '@nova/api-client';
import {
  getFakeCatalogFacets,
  isStorefrontFakeDataEnabled,
} from '@/shared/fixtures/dev-store-fixtures';

import type { CatalogFacetFilters } from '@/features/catalog/api/catalog-api-shared';

import { catalogFacetsRequestPath } from '@/features/catalog/api/catalog-facets-request-path';

export async function fetchCatalogFacets(
  filters: CatalogFacetFilters = {},
): Promise<CatalogFacets> {
  if (isStorefrontFakeDataEnabled()) return getFakeCatalogFacets(filters);
  const response = await apiClient.getEnvelope<CatalogFacets>(catalogFacetsRequestPath(filters));
  return response.data;
}
