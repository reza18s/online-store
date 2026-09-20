import { useQuery } from '@tanstack/react-query';
import { queryKeys, type AdminOrderListQuery } from '@nova/api-client';

import { fetchAdminOrders } from '@/features/orders/api/fetch-admin-orders';

import { normalizeAdminOrderQuery } from '@/features/orders/api/normalize-admin-order-query';

export function useAdminOrders(query: AdminOrderListQuery = {}, enabled = true) {
  const normalized = normalizeAdminOrderQuery(query);
  return useQuery({
    queryKey: queryKeys.adminOrders.list(normalized),
    queryFn: () => fetchAdminOrders(normalized),
    enabled,
    staleTime: 15_000,
  });
}
