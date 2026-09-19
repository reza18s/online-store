import { apiClient, type AdminCustomerListQuery, type AdminCustomerPage } from '@nova/api-client';

import { adminCustomersPath } from './admin-customers-path';

export async function fetchAdminCustomers(
  query: AdminCustomerListQuery = {},
): Promise<AdminCustomerPage> {
  const response = await apiClient.getEnvelope<AdminCustomerPage>(adminCustomersPath(query));
  return response.data;
}
