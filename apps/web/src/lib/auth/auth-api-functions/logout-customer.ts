import { apiClient } from '@nova/api-client';

import { customerAuthLogoutPath } from '../auth-api-shared';

export async function logoutCustomer(): Promise<null> {
  const response = await apiClient.postEnvelope<null>(customerAuthLogoutPath);
  return response.data;
}
