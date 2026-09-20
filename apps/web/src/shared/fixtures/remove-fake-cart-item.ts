import type { CartView } from '@nova/api-client';

import { fakeCart, setFakeCart } from '@/shared/fixtures/dev-store-fixtures-shared';

import { getFakeCart } from '@/shared/fixtures/get-fake-cart';

import { recalculateCart } from '@/shared/fixtures/recalculate-cart';

export function removeFakeCartItem(variantId: string): CartView {
  setFakeCart(recalculateCart(fakeCart.items.filter((item) => item.variantId !== variantId)));
  return getFakeCart();
}
