import type { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

export function invalidateAdminProductList(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog.products() });
}
