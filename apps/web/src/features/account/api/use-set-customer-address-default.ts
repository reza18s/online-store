import { useMutation, useQueryClient } from '@tanstack/react-query';

import { invalidateCustomerAddresses } from '@/features/account/api/invalidate-customer-addresses';

import { setCustomerAddressDefault } from '@/features/account/api/set-customer-address-default';

export function useSetCustomerAddressDefault() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setCustomerAddressDefault,
    onSuccess: () => invalidateCustomerAddresses(queryClient),
  });
}
