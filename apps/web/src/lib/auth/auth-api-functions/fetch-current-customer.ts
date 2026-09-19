import { apiClient, type CustomerUser } from '@nova/api-client';

import { customerAuthMePath } from '../auth-api-shared';

export async function fetchCurrentCustomer(): Promise<CustomerUser | null> {
  const response = await apiClient.getEnvelope<CustomerUser | null>(customerAuthMePath);
  return response.data;
}
