import {
  apiClient,
  type CustomerOrderCancelInput,
  type CustomerOrderDetail,
} from '@nova/api-client';

import { customerOrderCancelPath } from './customer-order-cancel-path';

export async function cancelCustomerOrder(
  orderNumber: string,
  input: CustomerOrderCancelInput,
): Promise<CustomerOrderDetail> {
  const response = await apiClient.postEnvelope<CustomerOrderDetail>(
    customerOrderCancelPath(orderNumber),
    input,
  );
  return response.data;
}
