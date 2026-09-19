import {
  apiClient,
  type AdminCatalogProductOptionValue,
  type AdminCatalogProductOptionValueCreateInput,
} from '@nova/api-client';

import { encodeId } from './encode-id';

export async function createAdminProductOptionValue(
  productId: string,
  optionId: string,
  input: AdminCatalogProductOptionValueCreateInput,
): Promise<AdminCatalogProductOptionValue> {
  const response = await apiClient.postEnvelope<AdminCatalogProductOptionValue>(
    `/v1/admin/catalog/products/${encodeId(productId)}/options/${encodeId(optionId)}/values`,
    input,
  );
  return response.data;
}
