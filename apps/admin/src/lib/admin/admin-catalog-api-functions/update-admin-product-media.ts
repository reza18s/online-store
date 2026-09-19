import {
  apiClient,
  type AdminCatalogProductMedia,
  type AdminCatalogProductMediaUpdateInput,
} from '@nova/api-client';

import { encodeId } from './encode-id';

export async function updateAdminProductMedia(
  productId: string,
  mediaId: string,
  input: AdminCatalogProductMediaUpdateInput,
): Promise<AdminCatalogProductMedia> {
  const response = await apiClient.patchEnvelope<AdminCatalogProductMedia>(
    `/v1/admin/catalog/products/${encodeId(productId)}/media/${encodeId(mediaId)}`,
    input,
  );
  return response.data;
}
