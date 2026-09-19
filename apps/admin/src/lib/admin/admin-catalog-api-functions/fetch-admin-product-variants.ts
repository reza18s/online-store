import { apiClient, type AdminCatalogProductVariant } from '@nova/api-client';

import { encodeId } from './encode-id';

export async function fetchAdminProductVariants(
  productId: string,
): Promise<AdminCatalogProductVariant[]> {
  const response = await apiClient.getEnvelope<AdminCatalogProductVariant[]>(
    `/v1/admin/catalog/products/${encodeId(productId)}/variants`,
  );
  return response.data;
}
