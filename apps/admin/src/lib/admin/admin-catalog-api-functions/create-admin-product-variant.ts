import {
  apiClient,
  type AdminCatalogProductVariant,
  type AdminCatalogProductVariantCreateInput,
} from '@nova/api-client';

import { encodeId } from './encode-id';

export async function createAdminProductVariant(
  productId: string,
  input: AdminCatalogProductVariantCreateInput,
): Promise<AdminCatalogProductVariant> {
  const response = await apiClient.postEnvelope<AdminCatalogProductVariant>(
    `/v1/admin/catalog/products/${encodeId(productId)}/variants`,
    input,
  );
  return response.data;
}
