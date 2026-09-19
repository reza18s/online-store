import { apiClient, type AdminOrderDetail } from '@nova/api-client';

import { encodeOrderNumber } from './encode-order-number';

export async function fetchAdminOrder(orderNumber: string): Promise<AdminOrderDetail> {
  const response = await apiClient.getEnvelope<AdminOrderDetail>(
    `/v1/admin/orders/${encodeOrderNumber(orderNumber)}`,
  );
  return response.data;
}
