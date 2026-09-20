import { queryKeys } from '@nova/api-client';
import { type QueryClient } from '@tanstack/react-query';

export function clearCustomerProtectedCache(queryClient: QueryClient, resetSession = false): void {
  queryClient.removeQueries({ queryKey: queryKeys.account.addresses() });
  queryClient.removeQueries({ queryKey: queryKeys.orders.all });
  queryClient.removeQueries({ queryKey: queryKeys.cart.current() });
  if (resetSession) queryClient.setQueryData(queryKeys.account.current(), null);
}
