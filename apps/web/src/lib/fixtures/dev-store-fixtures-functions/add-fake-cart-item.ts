import type { CartView } from '@nova/api-client';

import { fakeCart, fakeCatalogProducts, setFakeCart } from '../dev-store-fixtures-shared';

import { cartLineFor } from './cart-line-for';

import { getFakeCart } from './get-fake-cart';

import { recalculateCart } from './recalculate-cart';

export function addFakeCartItem(variantId: string, quantity: number): CartView {
  const product = fakeCatalogProducts.find((candidate) =>
    candidate.variants.some((variant) => variant.id === variantId),
  );
  const variant = product?.variants.find((candidate) => candidate.id === variantId);
  if (!product || !variant) throw new Error('تنوع انتخاب‌شده در داده نمونه پیدا نشد.');

  const items = [...fakeCart.items];
  const existing = items.find((item) => item.variantId === variantId);
  if (existing) existing.quantity += quantity;
  else items.push(cartLineFor(product, variant, Math.max(1, quantity)));
  setFakeCart(recalculateCart(items));
  return getFakeCart();
}
