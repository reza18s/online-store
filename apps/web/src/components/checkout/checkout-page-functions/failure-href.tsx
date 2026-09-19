import { type CheckoutRequestInput } from '@nova/api-client';

import { buildCheckoutHref, type CheckoutFailure } from '../../../lib/checkout/checkout-state';

export function failureHref(
  failure: CheckoutFailure,
  input: CheckoutRequestInput,
): string | undefined {
  switch (failure.action) {
    case 'address':
      return buildCheckoutHref('address', input);
    case 'shipping':
      return buildCheckoutHref('shipping', input);
    case 'payment':
      return buildCheckoutHref('payment', input);
    case 'cart':
      return '#cart';
    case 'login':
      return '#auth';
    case 'orders':
      return '#account/orders';
    default:
      return undefined;
  }
}
