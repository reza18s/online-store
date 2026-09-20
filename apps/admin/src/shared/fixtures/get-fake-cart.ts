import type { CartView } from '@nova/api-client';

import { fakeCart } from '@/shared/fixtures/dev-store-fixtures-shared';

export function getFakeCart(): CartView {
  return { ...fakeCart, items: fakeCart.items.map((item) => ({ ...item })) };
}
