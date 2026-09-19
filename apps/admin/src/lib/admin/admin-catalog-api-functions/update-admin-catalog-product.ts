import {
  apiClient,
  type AdminCatalogProductDetail,
  type AdminCatalogProductUpdateInput,
} from '@nova/api-client';

import { encodeId } from './encode-id';

export async function updateAdminCatalogProduct(
  productId: string,
  input: AdminCatalogProductUpdateInput,
): Promise<AdminCatalogProductDetail> {
  const response = await apiClient.patchEnvelope<AdminCatalogProductDetail>(
    `/v1/admin/catalog/products/${encodeId(productId)}`,
    input,
  );
  return response.data;
}
