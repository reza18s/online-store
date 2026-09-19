import { queryKeys, type CartView, type CustomerUser } from '@nova/api-client';

import type { CustomerVerificationQueryClient } from '../auth-api-shared';

import { shouldDiscardCartCacheOnCustomerVerification } from './should-discard-cart-cache-on-customer-verification';

export function applyVerifiedCustomerSession(
  queryClient: CustomerVerificationQueryClient,
  user: CustomerUser,
): void {
  const currentCart = queryClient.getQueryData<CartView>(queryKeys.cart.current());

  queryClient.removeQueries({ queryKey: queryKeys.account.addresses() });
  queryClient.removeQueries({ queryKey: queryKeys.orders.all });
  if (shouldDiscardCartCacheOnCustomerVerification(currentCart)) {
    queryClient.removeQueries({ queryKey: queryKeys.cart.current() });
  }
  queryClient.setQueryData(queryKeys.account.current(), user);
}
