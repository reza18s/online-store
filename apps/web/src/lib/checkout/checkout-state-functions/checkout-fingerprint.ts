import { type CheckoutRequestInput } from '@nova/api-client';

import type { CheckoutIdempotencyQuote } from '../checkout-state-shared';

export function checkoutFingerprint(
  input: CheckoutRequestInput,
  quote: CheckoutIdempotencyQuote,
): string {
  return JSON.stringify({
    addressId: input.addressId,
    shippingMethod: input.shippingMethod,
    couponCode: input.couponCode?.trim() || undefined,
    cartId: quote.cartId,
    lines: quote.lines
      .map(({ cartItemId, variantId, quantity }) => ({ cartItemId, variantId, quantity }))
      .sort((left, right) => left.cartItemId.localeCompare(right.cartItemId)),
  });
}
