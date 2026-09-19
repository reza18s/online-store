import type { CartView } from '@nova/api-client';

import { getFakeCart } from './get-fake-cart';

export function mergeFakeCart(): CartView {
  return getFakeCart();
}
