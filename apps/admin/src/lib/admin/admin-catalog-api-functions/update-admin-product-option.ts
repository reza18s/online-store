import {
  apiClient,
  type AdminCatalogProductOption,
  type AdminCatalogProductOptionUpdateInput,
} from '@nova/api-client';

import { encodeId } from './encode-id';

export async function updateAdminProductOption(
  productId: string,
  optionId: string,
  input: AdminCatalogProductOptionUpdateInput,
): Promise<AdminCatalogProductOption> {
  const response = await apiClient.patchEnvelope<AdminCatalogProductOption>(
    `/v1/admin/catalog/products/${encodeId(productId)}/options/${encodeId(optionId)}`,
    input,
  );
  return response.data;
}
