import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminOrderStatusInput } from '@nova/api-client';

import { updateAdminOrderStatus } from './update-admin-order-status';

export function useUpdateAdminOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminOrders.all,
    mutationFn: ({ orderNumber, input }: { orderNumber: string; input: AdminOrderStatusInput }) =>
      updateAdminOrderStatus(orderNumber, input),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.adminOrders.detail(order.orderNumber), order);
      return queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders.all });
    },
  });
}
