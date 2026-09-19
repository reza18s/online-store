import { apiClient, type AdminCatalogCategory } from '@nova/api-client';

import { encodeId } from './encode-id';

export async function fetchAdminProductCategories(
  productId: string,
): Promise<AdminCatalogCategory[]> {
  const response = await apiClient.getEnvelope<AdminCatalogCategory[]>(
    `/v1/admin/catalog/products/${encodeId(productId)}/categories`,
  );
  return response.data;
}
