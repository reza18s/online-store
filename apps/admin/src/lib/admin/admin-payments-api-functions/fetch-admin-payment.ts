import { apiClient, type AdminPaymentAttempt } from '@nova/api-client';

import { encodeId } from './encode-id';

export async function fetchAdminPayment(paymentAttemptId: string): Promise<AdminPaymentAttempt> {
  const response = await apiClient.getEnvelope<AdminPaymentAttempt>(
    `/v1/admin/payments/${encodeId(paymentAttemptId)}`,
  );
  return response.data;
}
