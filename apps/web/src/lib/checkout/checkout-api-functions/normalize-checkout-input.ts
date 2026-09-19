import { type CheckoutRequestInput } from '@nova/api-client';

export function normalizeCheckoutInput(input: CheckoutRequestInput): CheckoutRequestInput {
  const couponCode = input.couponCode?.trim();
  return couponCode
    ? { ...input, couponCode }
    : { addressId: input.addressId, shippingMethod: input.shippingMethod };
}
