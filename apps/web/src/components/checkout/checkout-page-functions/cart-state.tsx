import { Button } from '@nova/ui';

import { Icon } from '../../ui/icon';

import type { CheckoutPageProps } from '../../../pages/checkout/checkout-page-shared';

import { CheckoutShell } from './checkout-shell';

import { LoadingState } from './loading-state';

export function CartState({
  cart,
  cartLoading,
  cartError,
  onRetryCart,
}: Pick<CheckoutPageProps, 'cart' | 'cartLoading' | 'cartError' | 'onRetryCart'>) {
  if (cartLoading) return <LoadingState label="در حال بارگذاری سبد خرید" />;
  if (cartError || !cart) {
    return (
      <CheckoutShell>
        <section className="mx-auto flex min-h-[55svh] max-w-xl flex-col items-center justify-center rounded-editorial border border-border bg-surface p-8 text-center shadow-card">
          <Icon name="warning" size={24} />
          <h1 className="mt-4 text-xl">سبد خرید بارگذاری نشد</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            اتصال خود را بررسی کنید؛ هیچ سفارشی ثبت نشده است.
          </p>
          <Button className="mt-5" type="button" variant="outline" onClick={onRetryCart}>
            تلاش دوباره
          </Button>
        </section>
      </CheckoutShell>
    );
  }
  if (!cart.items.length) {
    return (
      <CheckoutShell>
        <section className="mx-auto flex min-h-[55svh] max-w-xl flex-col items-center justify-center rounded-editorial border border-border bg-surface p-8 text-center shadow-card">
          <h1 className="text-xl">سبد خرید شما خالی است</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            برای تکمیل سفارش، ابتدا یک محصول به سبد خرید اضافه کنید.
          </p>
          <Button className="mt-5" asChild size="lg">
            <a href="#products">مشاهده فروشگاه</a>
          </Button>
        </section>
      </CheckoutShell>
    );
  }
  return null;
}
