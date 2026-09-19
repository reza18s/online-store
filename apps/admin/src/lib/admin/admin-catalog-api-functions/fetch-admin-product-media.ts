import { apiClient, type AdminCatalogProductMedia } from '@nova/api-client';

import { encodeId } from './encode-id';

export async function fetchAdminProductMedia(
  productId: string,
): Promise<AdminCatalogProductMedia[]> {
  const response = await apiClient.getEnvelope<AdminCatalogProductMedia[]>(
    `/v1/admin/catalog/products/${encodeId(productId)}/media`,
  );
  return response.data;
}
