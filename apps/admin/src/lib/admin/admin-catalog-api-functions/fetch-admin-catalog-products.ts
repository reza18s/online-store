import {
  apiClient,
  type AdminCatalogProductListQuery,
  type AdminCatalogProductPage,
} from '@nova/api-client';

import { adminCatalogProductsPath } from './admin-catalog-products-path';

export async function fetchAdminCatalogProducts(
  query: AdminCatalogProductListQuery = {},
): Promise<AdminCatalogProductPage> {
  const response = await apiClient.getEnvelope<AdminCatalogProductPage>(
    adminCatalogProductsPath(query),
  );
  return response.data;
}
