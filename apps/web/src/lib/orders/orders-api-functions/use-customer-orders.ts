import { useQuery } from '@tanstack/react-query';
import { queryKeys, type CustomerOrderListQuery } from '@nova/api-client';

import { fetchCustomerOrders } from './fetch-customer-orders';

import { normalizeOrderQuery } from './normalize-order-query';

export function useCustomerOrders(query: CustomerOrderListQuery = {}, enabled = true) {
  const normalized = normalizeOrderQuery(query);
  return useQuery({
    queryKey: queryKeys.orders.list(normalized),
    queryFn: () => fetchCustomerOrders(normalized),
    enabled,
    staleTime: 15_000,
  });
}
