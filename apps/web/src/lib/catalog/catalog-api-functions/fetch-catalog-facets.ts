import { apiClient, type CatalogFacets } from '@nova/api-client';
import {
  getFakeCatalogFacets,
  isStorefrontFakeDataEnabled,
} from '../../fixtures/dev-store-fixtures';

import type { CatalogFacetFilters } from '../catalog-api-shared';

import { catalogFacetsRequestPath } from './catalog-facets-request-path';

export async function fetchCatalogFacets(
  filters: CatalogFacetFilters = {},
): Promise<CatalogFacets> {
  if (isStorefrontFakeDataEnabled()) return getFakeCatalogFacets(filters);
  const response = await apiClient.getEnvelope<CatalogFacets>(catalogFacetsRequestPath(filters));
  return response.data;
}
