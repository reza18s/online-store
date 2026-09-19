import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminReturnReviewInput } from '@nova/api-client';

import { reviewAdminOrderReturn } from './review-admin-order-return';

export function useReviewAdminOrderReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminOrders.all,
    mutationFn: ({ orderNumber, input }: { orderNumber: string; input: AdminReturnReviewInput }) =>
      reviewAdminOrderReturn(orderNumber, input),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.adminOrders.detail(order.orderNumber), order);
      return queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders.all });
    },
  });
}
