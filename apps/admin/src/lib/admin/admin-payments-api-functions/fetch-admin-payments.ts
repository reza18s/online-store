import { apiClient, type AdminPaymentListQuery, type AdminPaymentPage } from '@nova/api-client';

import { adminPaymentsPath } from './admin-payments-path';

export async function fetchAdminPayments(
  query: AdminPaymentListQuery = {},
): Promise<AdminPaymentPage> {
  const response = await apiClient.getEnvelope<AdminPaymentPage>(adminPaymentsPath(query));
  return response.data;
}
