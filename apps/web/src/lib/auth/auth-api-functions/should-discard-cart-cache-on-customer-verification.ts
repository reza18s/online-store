import { type CartView } from '@nova/api-client';

export function shouldDiscardCartCacheOnCustomerVerification(cart: CartView | undefined): boolean {
  return cart?.kind === 'CUSTOMER';
}
