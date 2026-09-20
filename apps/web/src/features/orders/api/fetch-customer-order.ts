import { apiClient, type CustomerOrderDetail } from '@nova/api-client';

import { encodeOrderNumber } from '@/features/orders/api/encode-order-number';

export async function fetchCustomerOrder(orderNumber: string): Promise<CustomerOrderDetail> {
  const response = await apiClient.getEnvelope<CustomerOrderDetail>(
    `/v1/account/orders/${encodeOrderNumber(orderNumber)}`,
  );
  return response.data;
}
