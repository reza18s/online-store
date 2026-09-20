import { apiClient, type OtpVerifyInput, type OtpVerifyResponse } from '@nova/api-client';

import { customerAuthOtpVerifyPath } from '@/features/auth/api/auth-api-shared';

export async function verifyCustomerOtp(input: OtpVerifyInput): Promise<OtpVerifyResponse> {
  const response = await apiClient.postEnvelope<OtpVerifyResponse>(
    customerAuthOtpVerifyPath,
    input,
  );
  return response.data;
}
