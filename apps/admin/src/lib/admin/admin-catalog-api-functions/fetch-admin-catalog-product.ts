import { apiClient, type AdminCatalogProductDetail } from '@nova/api-client';

import { adminCatalogProductPath } from './admin-catalog-product-path';

export async function fetchAdminCatalogProduct(
  productId: string,
): Promise<AdminCatalogProductDetail> {
  const response = await apiClient.getEnvelope<AdminCatalogProductDetail>(
    adminCatalogProductPath(productId),
  );
  return response.data;
}
