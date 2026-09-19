import { useQuery } from '@tanstack/react-query';
import { queryKeys, type AdminInventoryListQuery } from '@nova/api-client';

import { fetchAdminInventory } from './fetch-admin-inventory';

import { normalizeInventoryQuery } from './normalize-inventory-query';

export function useAdminInventory(query: AdminInventoryListQuery = {}, enabled = true) {
  const normalized = normalizeInventoryQuery(query);
  return useQuery({
    queryKey: queryKeys.adminInventory.items(normalized),
    queryFn: () => fetchAdminInventory(normalized),
    enabled,
    staleTime: 15_000,
  });
}
