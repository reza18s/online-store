import {
  apiClient,
  type AdminCatalogProductOptionValue,
  type AdminCatalogProductOptionValueUpdateInput,
} from '@nova/api-client';

import { encodeId } from './encode-id';

export async function updateAdminProductOptionValue(
  productId: string,
  optionId: string,
  valueId: string,
  input: AdminCatalogProductOptionValueUpdateInput,
): Promise<AdminCatalogProductOptionValue> {
  const response = await apiClient.patchEnvelope<AdminCatalogProductOptionValue>(
    `/v1/admin/catalog/products/${encodeId(productId)}/options/${encodeId(optionId)}/values/${encodeId(valueId)}`,
    input,
  );
  return response.data;
}
