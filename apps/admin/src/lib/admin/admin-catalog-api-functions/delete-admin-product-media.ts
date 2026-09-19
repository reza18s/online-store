import { apiClient } from '@nova/api-client';

import { encodeId } from './encode-id';

export async function deleteAdminProductMedia(
  productId: string,
  mediaId: string,
): Promise<{ deleted: true }> {
  const response = await apiClient.deleteEnvelope<{ deleted: true }>(
    `/v1/admin/catalog/products/${encodeId(productId)}/media/${encodeId(mediaId)}`,
  );
  return response.data;
}
