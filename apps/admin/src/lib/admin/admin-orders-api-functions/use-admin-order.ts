import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchAdminOrder } from './fetch-admin-order';

export function useAdminOrder(orderNumber: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminOrders.detail(orderNumber),
    queryFn: () => fetchAdminOrder(orderNumber),
    enabled: enabled && Boolean(orderNumber),
    staleTime: 15_000,
  });
}
