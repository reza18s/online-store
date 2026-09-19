import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type CustomerUser } from '@nova/api-client';

import { logoutCustomer } from './logout-customer';

export function useLogoutCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutCustomer,
    onSuccess: () => {
      queryClient.setQueryData<CustomerUser | null>(queryKeys.account.current(), null);
      queryClient.removeQueries({ queryKey: queryKeys.account.addresses() });
      queryClient.removeQueries({ queryKey: queryKeys.cart.current() });
      queryClient.removeQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
