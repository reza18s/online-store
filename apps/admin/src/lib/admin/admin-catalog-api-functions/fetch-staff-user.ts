import { apiClient, type StaffUser } from '@nova/api-client';

export async function fetchStaffUser(): Promise<StaffUser> {
  const response = await apiClient.getEnvelope<StaffUser>('/v1/staff/auth/me');
  return response.data;
}
