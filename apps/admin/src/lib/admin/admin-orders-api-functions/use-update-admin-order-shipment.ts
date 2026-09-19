import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminShipmentUpdateInput } from '@nova/api-client';

import { updateAdminOrderShipment } from './update-admin-order-shipment';

export function useUpdateAdminOrderShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminOrders.all,
    mutationFn: ({
      orderNumber,
      input,
    }: {
      orderNumber: string;
      input: AdminShipmentUpdateInput;
    }) => updateAdminOrderShipment(orderNumber, input),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.adminOrders.detail(order.orderNumber), order);
      return queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders.all });
    },
  });
}
