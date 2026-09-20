import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { removeCustomerAddress } from '@/features/account/api/remove-customer-address';

export function useRemoveCustomerAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeCustomerAddress,
    onSuccess: (addresses) => queryClient.setQueryData(queryKeys.account.addresses(), addresses),
  });
}
