import { useMutation, useQueryClient } from '@tanstack/react-query';

import { invalidateCustomerAddresses } from './invalidate-customer-addresses';

import { setCustomerAddressDefault } from './set-customer-address-default';

export function useSetCustomerAddressDefault() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setCustomerAddressDefault,
    onSuccess: () => invalidateCustomerAddresses(queryClient),
  });
}
