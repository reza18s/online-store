import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createCustomerAddress } from './create-customer-address';

import { invalidateCustomerAddresses } from './invalidate-customer-addresses';

export function useCreateCustomerAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomerAddress,
    onSuccess: () => invalidateCustomerAddresses(queryClient),
  });
}
