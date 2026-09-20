import { apiClient, type CustomerUser } from '@nova/api-client';

import { customerAuthMePath } from '@/features/auth/api/auth-api-shared';

export async function fetchCurrentCustomer(): Promise<CustomerUser | null> {
  const response = await apiClient.getEnvelope<CustomerUser | null>(customerAuthMePath);
  return response.data;
}
