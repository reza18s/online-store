import { useMutation } from '@tanstack/react-query';

import { requestCustomerOtp } from '@/features/auth/api/request-customer-otp';

export function useRequestCustomerOtp() {
  return useMutation({ mutationFn: requestCustomerOtp });
}
