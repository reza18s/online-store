import { useMutation } from '@tanstack/react-query';

import { requestCustomerOtp } from './request-customer-otp';

export function useRequestCustomerOtp() {
  return useMutation({ mutationFn: requestCustomerOtp });
}
