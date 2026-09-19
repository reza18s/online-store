import { apiClient, type OtpVerifyInput, type OtpVerifyResponse } from '@nova/api-client';

import { customerAuthOtpVerifyPath } from '../auth-api-shared';

export async function verifyCustomerOtp(input: OtpVerifyInput): Promise<OtpVerifyResponse> {
  const response = await apiClient.postEnvelope<OtpVerifyResponse>(
    customerAuthOtpVerifyPath,
    input,
  );
  return response.data;
}
