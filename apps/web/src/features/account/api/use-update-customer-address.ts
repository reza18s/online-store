import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type CustomerAddressUpdateInput } from '@nova/api-client';

import { invalidateCustomerAddresses } from '@/features/account/api/invalidate-customer-addresses';

import { updateCustomerAddress } from '@/features/account/api/update-customer-address';

export function useUpdateCustomerAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addressId, input }: { addressId: string; input: CustomerAddressUpdateInput }) =>
      updateCustomerAddress(addressId, input),
    onSuccess: () => invalidateCustomerAddresses(queryClient),
  });
}
