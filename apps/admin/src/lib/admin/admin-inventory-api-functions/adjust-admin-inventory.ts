import {
  apiClient,
  type AdminInventoryAdjustmentInput,
  type AdminInventoryItem,
} from '@nova/api-client';

import { encodeId } from './encode-id';

export async function adjustAdminInventory(
  variantId: string,
  input: AdminInventoryAdjustmentInput,
): Promise<AdminInventoryItem> {
  const response = await apiClient.postEnvelope<AdminInventoryItem>(
    `/v1/admin/inventory/items/${encodeId(variantId)}/adjustments`,
    input,
  );
  return response.data;
}
