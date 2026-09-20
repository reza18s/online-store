import { apiClient, type CatalogProductPage } from '@nova/api-client';
import {
  getFakeCatalogProducts,
  isStorefrontFakeDataEnabled,
} from '@/shared/fixtures/dev-store-fixtures';

import type { CatalogFilters } from '@/features/catalog/api/catalog-api-shared';

import { catalogRequestPath } from '@/features/catalog/api/catalog-request-path';

export async function fetchCatalogProducts(
  filters: CatalogFilters = {},
): Promise<CatalogProductPage> {
  if (isStorefrontFakeDataEnabled()) return getFakeCatalogProducts(filters);
  const response = await apiClient.getEnvelope<CatalogProductPage>(catalogRequestPath(filters));
  return response.data;
}
