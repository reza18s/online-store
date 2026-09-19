import { useQuery } from '@tanstack/react-query';
import { queryKeys, type AdminOrderListQuery } from '@nova/api-client';

import { fetchAdminOrders } from './fetch-admin-orders';

import { normalizeAdminOrderQuery } from './normalize-admin-order-query';

export function useAdminOrders(query: AdminOrderListQuery = {}, enabled = true) {
  const normalized = normalizeAdminOrderQuery(query);
  return useQuery({
    queryKey: queryKeys.adminOrders.list(normalized),
    queryFn: () => fetchAdminOrders(normalized),
    enabled,
    staleTime: 15_000,
  });
}
