import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchCustomerAddresses } from './fetch-customer-addresses';

export function useCustomerAddresses(enabled = true) {
  return useQuery({
    queryKey: queryKeys.account.addresses(),
    queryFn: fetchCustomerAddresses,
    enabled,
    staleTime: 15_000,
  });
}
