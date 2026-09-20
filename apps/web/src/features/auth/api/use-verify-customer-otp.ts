import { useMutation, useQueryClient } from '@tanstack/react-query';

import { applyVerifiedCustomerSession } from '@/features/auth/api/apply-verified-customer-session';

import { verifyCustomerOtp } from '@/features/auth/api/verify-customer-otp';

export function useVerifyCustomerOtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyCustomerOtp,
    onSuccess: (result) => applyVerifiedCustomerSession(queryClient, result.user),
  });
}
