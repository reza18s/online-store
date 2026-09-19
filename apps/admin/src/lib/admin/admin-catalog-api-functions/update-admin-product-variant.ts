import {
  apiClient,
  type AdminCatalogProductVariant,
  type AdminCatalogProductVariantUpdateInput,
} from '@nova/api-client';

import { encodeId } from './encode-id';

export async function updateAdminProductVariant(
  productId: string,
  variantId: string,
  input: AdminCatalogProductVariantUpdateInput,
): Promise<AdminCatalogProductVariant> {
  const response = await apiClient.patchEnvelope<AdminCatalogProductVariant>(
    `/v1/admin/catalog/products/${encodeId(productId)}/variants/${encodeId(variantId)}`,
    input,
  );
  return response.data;
}
