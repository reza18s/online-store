import { type CartView } from '@nova/api-client';

export function shouldMergeGuestCart(cart: CartView | undefined, customerId?: string): boolean {
  return Boolean(customerId && cart?.kind === 'GUEST');
}
