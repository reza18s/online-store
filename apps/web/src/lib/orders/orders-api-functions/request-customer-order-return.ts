import {
  apiClient,
  type CustomerOrderDetail,
  type CustomerReturnRequestInput,
} from '@nova/api-client';

import { customerOrderReturnPath } from './customer-order-return-path';

export async function requestCustomerOrderReturn(
  orderNumber: string,
  input: CustomerReturnRequestInput,
): Promise<CustomerOrderDetail> {
  const response = await apiClient.postEnvelope<CustomerOrderDetail>(
    customerOrderReturnPath(orderNumber),
    input,
  );
  return response.data;
}
