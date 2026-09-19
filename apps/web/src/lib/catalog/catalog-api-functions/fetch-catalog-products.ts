import { apiClient, type CatalogProductPage } from '@nova/api-client';
import {
  getFakeCatalogProducts,
  isStorefrontFakeDataEnabled,
} from '../../fixtures/dev-store-fixtures';

import type { CatalogFilters } from '../catalog-api-shared';

import { catalogRequestPath } from './catalog-request-path';

export async function fetchCatalogProducts(
  filters: CatalogFilters = {},
): Promise<CatalogProductPage> {
  if (isStorefrontFakeDataEnabled()) return getFakeCatalogProducts(filters);
  const response = await apiClient.getEnvelope<CatalogProductPage>(catalogRequestPath(filters));
  return response.data;
}
