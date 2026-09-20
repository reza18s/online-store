import type { CartView } from '@nova/api-client';
import { Button } from '@nova/ui';

import type { CheckoutPageProps } from '../../../pages/checkout/checkout-page-shared';

import { AddressForm } from './address-form';

import { CheckoutShell } from './checkout-shell';

import { CheckoutStepPanel } from './checkout-step-panel';

import { LoadingState } from './loading-state';

import { OrderSummary } from './order-summary';

import { useCheckoutPageController } from './use-checkout-page-controller';

export function CheckoutPageContent({
  step: rawStep,
  queryString = '',
  cart,
}: CheckoutPageProps & { cart: CartView }) {
  const controller = useCheckoutPageController({ step: rawStep, queryString, cart });

  if (controller.addressesQuery.isPending) {
    return <LoadingState label="در حال بارگذاری آدرس‌ها" />;
  }

  if (controller.addressesQuery.isError) {
    return (
      <CheckoutShell>
        <section className="mx-auto max-w-xl border border-border bg-surface p-8 text-center shadow-card">
          <h1 className="text-xl">
            {controller.needsLogin ? 'برای تکمیل خرید وارد شوید' : controller.addressFailure?.title}
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {controller.needsLogin
              ? 'برای انتخاب آدرس و ثبت سفارش، ابتدا وارد حساب خود شوید.'
              : controller.addressFailure?.message}
          </p>
          <Button className="mt-5" asChild variant="outline">
            <a href={controller.needsLogin ? '#auth' : '#checkout/address'}>
              {controller.needsLogin ? 'ورود به حساب' : 'تلاش دوباره'}
            </a>
          </Button>
        </section>
      </CheckoutShell>
    );
  }

  if (!controller.addressesQuery.data?.length) {
    return (
      <CheckoutShell>
        <div className="checkout-layout lg:grid">
          <section className="checkout-main" aria-labelledby="checkout-title">
            <header className="simple-page-header">
              <span className="section-heading__eyebrow">مرحله ۱ از ۳</span>
              <h1 id="checkout-title">آدرس تحویل</h1>
              <p>برای ادامه‌ی خرید، یک آدرس واقعی برای تحویل سفارش ثبت کنید.</p>
            </header>
            <AddressForm
              addresses={[]}
              selectedAddressId=""
              onSelect={() => undefined}
              showNewAddress
              draft={controller.addressDraft}
              onDraftChange={(key, value) =>
                controller.setAddressDraft((current) => ({ ...current, [key]: value }))
              }
              onCreate={(event) => void controller.createAddress(event)}
              creating={controller.createAddressMutation.isPending}
              createFailure={controller.failureSource === 'address' ? controller.failure : null}
            />
          </section>
          <OrderSummary cart={cart} quote={undefined} />
        </div>
      </CheckoutShell>
    );
  }

  if (controller.currentStep !== 'address' && !controller.selectedAddress) {
    return (
      <CheckoutShell>
        <section className="mx-auto max-w-xl border border-border bg-surface p-8 text-center shadow-card">
          <h1 className="text-xl">آدرس این مرحله معتبر نیست</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            یک آدرس معتبر از حساب خود انتخاب کنید.
          </p>
          <Button className="mt-5" asChild variant="outline">
            <a href="#checkout/address">انتخاب آدرس</a>
          </Button>
        </section>
      </CheckoutShell>
    );
  }

  return (
    <CheckoutShell>
      <div className="breadcrumb">
        <a href="#cart">سبد خرید</a>
        <span>/</span>
        <span>تکمیل سفارش</span>
      </div>
      <CheckoutStepPanel controller={controller} cart={cart} />
    </CheckoutShell>
  );
}
