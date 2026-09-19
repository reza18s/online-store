import {
  apiClient,
  type AdminCatalogProductMedia,
  type AdminCatalogProductMediaCreateInput,
} from '@nova/api-client';

import { encodeId } from './encode-id';

export async function createAdminProductMedia(
  productId: string,
  input: AdminCatalogProductMediaCreateInput,
): Promise<AdminCatalogProductMedia> {
  const response = await apiClient.postEnvelope<AdminCatalogProductMedia>(
    `/v1/admin/catalog/products/${encodeId(productId)}/media`,
    input,
  );
  return response.data;
}
