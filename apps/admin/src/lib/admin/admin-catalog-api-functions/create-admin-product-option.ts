import {
  apiClient,
  type AdminCatalogProductOption,
  type AdminCatalogProductOptionCreateInput,
} from '@nova/api-client';

import { encodeId } from './encode-id';

export async function createAdminProductOption(
  productId: string,
  input: AdminCatalogProductOptionCreateInput,
): Promise<AdminCatalogProductOption> {
  const response = await apiClient.postEnvelope<AdminCatalogProductOption>(
    `/v1/admin/catalog/products/${encodeId(productId)}/options`,
    input,
  );
  return response.data;
}
