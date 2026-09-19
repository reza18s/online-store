import type { CartView } from '@nova/api-client';

import { fakeCart, setFakeCart } from '../dev-store-fixtures-shared';

import { getFakeCart } from './get-fake-cart';

import { recalculateCart } from './recalculate-cart';

export function removeFakeCartItem(variantId: string): CartView {
  setFakeCart(recalculateCart(fakeCart.items.filter((item) => item.variantId !== variantId)));
  return getFakeCart();
}
