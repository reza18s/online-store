import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type CustomerReturnRequestInput } from '@nova/api-client';

import { requestCustomerOrderReturn } from './request-customer-order-return';

export function useRequestCustomerOrderReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderNumber,
      input,
    }: {
      orderNumber: string;
      input: CustomerReturnRequestInput;
    }) => requestCustomerOrderReturn(orderNumber, input),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.orderNumber), order);
      return queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
