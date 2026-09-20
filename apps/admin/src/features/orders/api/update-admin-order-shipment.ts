import { apiClient, type AdminOrderDetail, type AdminShipmentUpdateInput } from '@nova/api-client';

import { adminOrderShipmentPath } from '@/features/orders/api/admin-order-shipment-path';

export async function updateAdminOrderShipment(
  orderNumber: string,
  input: AdminShipmentUpdateInput,
): Promise<AdminOrderDetail> {
  const response = await apiClient.patchEnvelope<AdminOrderDetail>(
    adminOrderShipmentPath(orderNumber),
    input,
  );
  return response.data;
}
