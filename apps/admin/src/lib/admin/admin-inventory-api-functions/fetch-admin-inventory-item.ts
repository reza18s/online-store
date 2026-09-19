import { apiClient, type AdminInventoryItem } from '@nova/api-client';

import { encodeId } from './encode-id';

export async function fetchAdminInventoryItem(variantId: string): Promise<AdminInventoryItem> {
  const response = await apiClient.getEnvelope<AdminInventoryItem>(
    `/v1/admin/inventory/items/${encodeId(variantId)}`,
  );
  return response.data;
}
