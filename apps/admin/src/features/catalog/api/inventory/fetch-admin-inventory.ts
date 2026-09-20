import { apiClient, type AdminInventoryListQuery, type AdminInventoryPage } from '@nova/api-client';

import { adminInventoryItemsPath } from '@/features/catalog/api/inventory/admin-inventory-items-path';

export async function fetchAdminInventory(
  query: AdminInventoryListQuery = {},
): Promise<AdminInventoryPage> {
  const response = await apiClient.getEnvelope<AdminInventoryPage>(adminInventoryItemsPath(query));
  return response.data;
}
