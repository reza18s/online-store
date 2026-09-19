import {
  apiClient,
  type AdminInventoryItem,
  type AdminInventoryReorderPointInput,
} from '@nova/api-client';

import { encodeId } from './encode-id';

export async function updateAdminInventoryReorderPoint(
  variantId: string,
  input: AdminInventoryReorderPointInput,
): Promise<AdminInventoryItem> {
  const response = await apiClient.patchEnvelope<AdminInventoryItem>(
    `/v1/admin/inventory/items/${encodeId(variantId)}/reorder-point`,
    input,
  );
  return response.data;
}
