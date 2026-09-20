import { apiClient, type OtpRequestInput, type OtpRequestResponse } from '@nova/api-client';

import { customerAuthOtpRequestPath } from '@/features/auth/api/auth-api-shared';

export async function requestCustomerOtp(input: OtpRequestInput): Promise<OtpRequestResponse> {
  const response = await apiClient.postEnvelope<OtpRequestResponse>(
    customerAuthOtpRequestPath,
    input,
  );
  return response.data;
}
