import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchCustomerOrder } from './fetch-customer-order';

export function useCustomerOrder(orderNumber: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderNumber),
    queryFn: () => fetchCustomerOrder(orderNumber),
    enabled: enabled && Boolean(orderNumber),
    staleTime: 15_000,
  });
}
