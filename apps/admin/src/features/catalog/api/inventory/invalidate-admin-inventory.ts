import type { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

export function invalidateAdminInventory(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: queryKeys.adminInventory.items() });
}
