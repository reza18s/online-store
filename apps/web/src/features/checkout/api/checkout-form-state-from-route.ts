import type { CheckoutRouteParams } from '@/features/checkout/api/checkout-state-shared';

export function checkoutFormStateFromRoute(
  params: Pick<CheckoutRouteParams, 'addressId' | 'shippingMethod' | 'couponCode'>,
): Pick<CheckoutRouteParams, 'addressId' | 'shippingMethod' | 'couponCode'> {
  return {
    addressId: params.addressId,
    shippingMethod: params.shippingMethod,
    couponCode: params.couponCode,
  };
}
