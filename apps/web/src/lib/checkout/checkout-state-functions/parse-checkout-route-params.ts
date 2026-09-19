import type { CheckoutRouteParams } from '../checkout-state-shared';

import { readPaymentState } from './read-payment-state';

export function parseCheckoutRouteParams(queryString = ''): CheckoutRouteParams {
  const params = new URLSearchParams(
    queryString.startsWith('?') ? queryString.slice(1) : queryString,
  );
  return {
    addressId: params.get('addressId')?.trim() ?? '',
    shippingMethod: params.get('shipping') === 'EXPRESS' ? 'EXPRESS' : 'STANDARD',
    couponCode: params.get('coupon')?.trim() ?? '',
    orderNumber: params.get('orderNumber')?.trim() ?? '',
    paymentState: readPaymentState(params.get('paymentState') ?? params.get('status')),
  };
}
