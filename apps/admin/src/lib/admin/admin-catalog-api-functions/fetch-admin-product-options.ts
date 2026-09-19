import { apiClient, type AdminCatalogProductOption } from '@nova/api-client';

import { encodeId } from './encode-id';

export async function fetchAdminProductOptions(
  productId: string,
): Promise<AdminCatalogProductOption[]> {
  const response = await apiClient.getEnvelope<AdminCatalogProductOption[]>(
    `/v1/admin/catalog/products/${encodeId(productId)}/options`,
  );
  return response.data;
}
