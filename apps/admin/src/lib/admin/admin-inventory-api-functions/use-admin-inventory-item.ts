import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchAdminInventoryItem } from './fetch-admin-inventory-item';

export function useAdminInventoryItem(variantId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminInventory.item(variantId),
    queryFn: () => fetchAdminInventoryItem(variantId),
    enabled: enabled && Boolean(variantId),
    staleTime: 15_000,
  });
}
