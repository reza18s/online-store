import { apiClient, type AdminOrderListQuery, type AdminOrderPage } from '@nova/api-client';

import { adminOrdersPath } from './admin-orders-path';

export async function fetchAdminOrders(query: AdminOrderListQuery = {}): Promise<AdminOrderPage> {
  const response = await apiClient.getEnvelope<AdminOrderPage>(adminOrdersPath(query));
  return response.data;
}
