import {
  apiClient,
  type AdminCatalogProduct,
  type AdminCatalogProductStatusInput,
} from '@nova/api-client';

import { encodeId } from './encode-id';

export async function updateAdminCatalogProductStatus(
  productId: string,
  input: AdminCatalogProductStatusInput,
): Promise<AdminCatalogProduct> {
  const response = await apiClient.patchEnvelope<AdminCatalogProduct>(
    `/v1/admin/catalog/products/${encodeId(productId)}/status`,
    input,
  );
  return response.data;
}
