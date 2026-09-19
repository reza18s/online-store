import { apiClient } from '@nova/api-client';

export async function logoutStaff(): Promise<null> {
  const response = await apiClient.postEnvelope<null>('/v1/staff/auth/logout');
  return response.data;
}
