import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createCustomerAddress } from '@/features/account/api/create-customer-address';

import { invalidateCustomerAddresses } from '@/features/account/api/invalidate-customer-addresses';

export function useCreateCustomerAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomerAddress,
    onSuccess: () => invalidateCustomerAddresses(queryClient),
  });
}
