import type { CartView } from '@nova/api-client';

import { getFakeCart } from '@/shared/fixtures/get-fake-cart';

export function mergeFakeCart(): CartView {
  return getFakeCart();
}
