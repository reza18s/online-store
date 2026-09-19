import { apiClient, type CustomerOrderListQuery, type CustomerOrderPage } from '@nova/api-client';

import { customerOrdersPath } from './customer-orders-path';

export async function fetchCustomerOrders(
  query: CustomerOrderListQuery = {},
): Promise<CustomerOrderPage> {
  const response = await apiClient.getEnvelope<CustomerOrderPage>(customerOrdersPath(query));
  return response.data;
}
