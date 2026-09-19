import type { CheckoutPageProps } from '../../../pages/checkout/checkout-page-shared';

import { CartState } from './cart-state';

import { CheckoutPageContent } from './checkout-page-content';

import { LoadingState } from './loading-state';

export function CheckoutPage(props: CheckoutPageProps) {
  if (props.cartLoading) return <LoadingState label="در حال بارگذاری سبد خرید" />;
  if (props.cartError || !props.cart) {
    return <CartState {...props} />;
  }
  if (!props.cart.items.length) {
    return <CartState {...props} />;
  }
  return <CheckoutPageContent {...props} cart={props.cart} />;
}
