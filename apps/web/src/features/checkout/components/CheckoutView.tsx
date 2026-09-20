import type { CheckoutPageProps } from '@/features/checkout/pages/checkout-page-shared';

import { CartState } from '@/features/checkout/components/cart-state';

import { CheckoutPageContent } from '@/features/checkout/components/checkout-page-content';

import { LoadingState } from '@/features/checkout/components/loading-state';

export function CheckoutView(props: CheckoutPageProps) {
  if (props.cartLoading) return <LoadingState label="در حال بارگذاری سبد خرید" />;
  if (props.cartError || !props.cart) {
    return <CartState {...props} />;
  }
  if (!props.cart.items.length) {
    return <CartState {...props} />;
  }
  return <CheckoutPageContent {...props} cart={props.cart} />;
}
