import { useMutation, useQueryClient } from '@tanstack/react-query';

import { applyVerifiedCustomerSession } from './apply-verified-customer-session';

import { verifyCustomerOtp } from './verify-customer-otp';

export function useVerifyCustomerOtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyCustomerOtp,
    onSuccess: (result) => applyVerifiedCustomerSession(queryClient, result.user),
  });
}
