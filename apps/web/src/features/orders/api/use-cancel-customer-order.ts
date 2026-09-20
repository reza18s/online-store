import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type CustomerOrderCancelInput } from '@nova/api-client';

import { cancelCustomerOrder } from '@/features/orders/api/cancel-customer-order';

export function useCancelCustomerOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderNumber,
      input,
    }: {
      orderNumber: string;
      input: CustomerOrderCancelInput;
    }) => cancelCustomerOrder(orderNumber, input),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.orderNumber), order);
      return queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
