import { apiClient, type AdminOrderStatusInput, type AdminOrderDetail } from '@nova/api-client';

import { adminOrderStatusPath } from '@/features/orders/api/admin-order-status-path';

export async function updateAdminOrderStatus(
  orderNumber: string,
  input: AdminOrderStatusInput,
): Promise<AdminOrderDetail> {
  const response = await apiClient.patchEnvelope<AdminOrderDetail>(
    adminOrderStatusPath(orderNumber),
    input,
  );
  return response.data;
}
