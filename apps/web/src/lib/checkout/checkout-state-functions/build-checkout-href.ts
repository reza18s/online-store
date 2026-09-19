import { type CheckoutRequestInput } from '@nova/api-client';

import type { CheckoutStep } from '../checkout-state-shared';

export function buildCheckoutHref(
  step: CheckoutStep,
  input: Pick<CheckoutRequestInput, 'addressId' | 'shippingMethod' | 'couponCode'>,
): string {
  const params = new URLSearchParams();
  if (input.addressId) params.set('addressId', input.addressId);
  if (step !== 'address') params.set('shipping', input.shippingMethod);
  if (step === 'payment' && input.couponCode?.trim()) {
    params.set('coupon', input.couponCode.trim());
  }
  const query = params.toString();
  return `#checkout/${step}${query ? `?${query}` : ''}`;
}
