import { apiClient, type StaffLoginInput, type StaffUser } from '@nova/api-client';

import { staffAuthCsrfPath } from '@/features/auth/api/staff-auth-paths';

export async function loginStaff(input: StaffLoginInput): Promise<StaffUser> {
  await apiClient.getEnvelope<null>(staffAuthCsrfPath);
  const response = await apiClient.postEnvelope<StaffUser>('/v1/staff/auth/login', input);
  return response.data;
}
