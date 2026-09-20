import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminInventoryAdjustmentInput } from '@nova/api-client';

import { adjustAdminInventory } from '@/features/catalog/api/inventory/adjust-admin-inventory';

import { invalidateAdminInventory } from '@/features/catalog/api/inventory/invalidate-admin-inventory';

export function useAdjustAdminInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminInventory.all,
    mutationFn: ({
      variantId,
      input,
    }: {
      variantId: string;
      input: AdminInventoryAdjustmentInput;
    }) => adjustAdminInventory(variantId, input),
    onSuccess: (item) => {
      queryClient.setQueryData(queryKeys.adminInventory.item(item.variantId), item);
      return invalidateAdminInventory(queryClient);
    },
  });
}
