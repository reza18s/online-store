import { apiClient, type CustomerOrderDetail } from '@nova/api-client';

import { encodeOrderNumber } from './encode-order-number';

export async function fetchCustomerOrder(orderNumber: string): Promise<CustomerOrderDetail> {
  const response = await apiClient.getEnvelope<CustomerOrderDetail>(
    `/v1/account/orders/${encodeOrderNumber(orderNumber)}`,
  );
  return response.data;
}
