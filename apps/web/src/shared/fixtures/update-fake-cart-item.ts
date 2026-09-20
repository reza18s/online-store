import type { CartView } from '@nova/api-client';

import { fakeCart, setFakeCart } from '@/shared/fixtures/dev-store-fixtures-shared';

import { getFakeCart } from '@/shared/fixtures/get-fake-cart';

import { recalculateCart } from '@/shared/fixtures/recalculate-cart';

export function updateFakeCartItem(variantId: string, quantity: number): CartView {
  const items = fakeCart.items
    .map((item) => (item.variantId === variantId ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);
  setFakeCart(recalculateCart(items));
  return getFakeCart();
}
