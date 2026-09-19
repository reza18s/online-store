import {
  apiClient,
  type AdminCatalogProductMedia,
  type AdminCatalogProductMediaCompleteInput,
} from '@nova/api-client';

import { encodeId } from './encode-id';

export async function completeAdminProductMedia(
  productId: string,
  input: AdminCatalogProductMediaCompleteInput,
): Promise<AdminCatalogProductMedia> {
  const response = await apiClient.postEnvelope<AdminCatalogProductMedia>(
    `/v1/admin/catalog/products/${encodeId(productId)}/media/complete`,
    input,
  );
  return response.data;
}
