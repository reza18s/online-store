import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type CustomerAddressUpdateInput } from '@nova/api-client';

import { invalidateCustomerAddresses } from './invalidate-customer-addresses';

import { updateCustomerAddress } from './update-customer-address';

export function useUpdateCustomerAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addressId, input }: { addressId: string; input: CustomerAddressUpdateInput }) =>
      updateCustomerAddress(addressId, input),
    onSuccess: () => invalidateCustomerAddresses(queryClient),
  });
}
