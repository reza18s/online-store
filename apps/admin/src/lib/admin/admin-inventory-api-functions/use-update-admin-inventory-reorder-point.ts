import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminInventoryReorderPointInput } from '@nova/api-client';

import { invalidateAdminInventory } from './invalidate-admin-inventory';

import { updateAdminInventoryReorderPoint } from './update-admin-inventory-reorder-point';

export function useUpdateAdminInventoryReorderPoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminInventory.all,
    mutationFn: ({
      variantId,
      input,
    }: {
      variantId: string;
      input: AdminInventoryReorderPointInput;
    }) => updateAdminInventoryReorderPoint(variantId, input),
    onSuccess: (item) => {
      queryClient.setQueryData(queryKeys.adminInventory.item(item.variantId), item);
      return invalidateAdminInventory(queryClient);
    },
  });
}
