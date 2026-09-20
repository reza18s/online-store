import type { CartView } from '@nova/api-client';
import { Button, Input as UiInput } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import { steps } from '@/features/checkout/pages/checkout-page-shared';

import { AddressForm } from '@/features/checkout/components/address-form';

import { FailurePanel } from '@/features/checkout/components/failure-panel';

import { PaymentOptions } from '@/features/checkout/components/payment-options';

import { ShippingOptions } from '@/features/checkout/components/shipping-options';

import { OrderSummary } from '@/features/checkout/components/order-summary';

import type { CheckoutPageController } from '@/features/checkout/components/use-checkout-page-controller';

type CheckoutStepPanelProps = {
  controller: CheckoutPageController;
  cart: CartView;
};

export function CheckoutStepPanel({ controller, cart }: CheckoutStepPanelProps) {
  const {
    currentStep,
    currentIndex,
    addressesQuery,
    createAddressMutation,
    submitMutation,
    selectedAddressId,
    setSelectedAddressId,
    shippingMethod,
    setShippingMethod,
    couponCode,
    setCouponCode,
    showNewAddress,
    setShowNewAddress,
    addressDraft,
    setAddressDraft,
    failure,
    setFailure,
    failureSource,
    setFailureSource,
    setRetryWithFreshIdempotencyKey,
    checkoutInput,
    quoteQuery,
    quoteExpired,
    quote,
    quoteRemainingLabel,
    activeFailure,
    retryTarget,
    createAddress,
    stepHref,
    submitOrder,
    goNext,
  } = controller;

  return (
    <div className="checkout-layout lg:grid">
      <section className="checkout-main" aria-labelledby="checkout-title">
        <nav className="checkout-stepper" aria-label="مراحل تکمیل سفارش">
          {steps.map((item, index) => (
            <a
              className={index <= currentIndex ? 'is-active' : ''}
              href={stepHref(item.key)}
              key={item.key}
            >
              <span>{index + 1}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <header className="simple-page-header">
          <span className="section-heading__eyebrow">مرحله {currentIndex + 1} از ۳</span>
          <h1 id="checkout-title">
            {currentStep === 'address'
              ? 'آدرس تحویل'
              : currentStep === 'shipping'
                ? 'روش ارسال'
                : 'پرداخت امن'}
          </h1>
          <p>اطلاعات شما فقط برای تکمیل همین سفارش استفاده می‌شود.</p>
        </header>
        {currentStep === 'address' ? (
          <AddressForm
            addresses={addressesQuery.data ?? []}
            selectedAddressId={selectedAddressId}
            onSelect={(id) => {
              setSelectedAddressId(id);
              setFailure(null);
              setFailureSource(null);
              setRetryWithFreshIdempotencyKey(false);
            }}
            showNewAddress={showNewAddress}
            onToggleNewAddress={() => setShowNewAddress((open) => !open)}
            draft={addressDraft}
            onDraftChange={(key, value) =>
              setAddressDraft((current) => ({ ...current, [key]: value }))
            }
            onCreate={(event) => void createAddress(event)}
            creating={createAddressMutation.isPending}
            createFailure={failureSource === 'address' ? failure : null}
          />
        ) : currentStep === 'shipping' ? (
          <ShippingOptions
            value={shippingMethod}
            onChange={(value) => {
              setShippingMethod(value);
              setFailure(null);
              setFailureSource(null);
              setRetryWithFreshIdempotencyKey(false);
            }}
            quote={quote}
          />
        ) : (
          <>
            <PaymentOptions />
            <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
              کد تخفیف (اختیاری)
              <UiInput
                className="min-h-12 border border-border bg-surface px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
                value={couponCode}
                dir="ltr"
                autoComplete="off"
                placeholder="کد تخفیف را وارد کنید"
                onChange={(event) => {
                  setCouponCode(event.target.value);
                  setFailure(null);
                  setFailureSource(null);
                  setRetryWithFreshIdempotencyKey(false);
                }}
              />
            </label>
            {quoteQuery.isPending ? (
              <div className="inline-message inline-message--info" role="status">
                <Icon name="refresh" size={16} /> در حال محاسبه دوباره مبلغ سفارش...
              </div>
            ) : null}
            {quote?.coupon ? (
              <div className="inline-message inline-message--success" role="status">
                <Icon name="check" size={16} /> کد <span dir="ltr">{quote.coupon.code}</span> اعمال
                شد.
              </div>
            ) : couponCode.trim() && quote && !quoteQuery.isPending ? (
              <div className="inline-message inline-message--error" role="alert">
                <Icon name="warning" size={16} /> این کد تخفیف اعمال نشد؛ مبلغ به‌روز را بررسی کنید.
              </div>
            ) : null}
          </>
        )}
        {quoteQuery.data && !quoteExpired && currentStep !== 'address' ? (
          <div className="inline-message inline-message--info" role="status">
            <Icon name="calendar" size={16} /> قیمت فعلی تا {quoteRemainingLabel} معتبر است؛ پس از
            آن مبلغ و موجودی دوباره بررسی می‌شود.
          </div>
        ) : null}
        {activeFailure && failureSource !== 'address' ? (
          <FailurePanel
            failure={activeFailure}
            input={checkoutInput}
            onRetry={
              retryTarget === 'submit'
                ? () => void submitOrder()
                : retryTarget === 'quote'
                  ? () => void quoteQuery.refetch()
                  : undefined
            }
          />
        ) : null}
        <Button
          className="checkout-next mt-6 min-h-11"
          disabled={
            submitMutation.isPending ||
            createAddressMutation.isPending ||
            (currentStep === 'address' && !controller.selectedAddress) ||
            (currentStep !== 'address' && (quoteQuery.isPending || !quote || quoteExpired))
          }
          size="lg"
          type="button"
          onClick={goNext}
        >
          {submitMutation.isPending
            ? 'در حال ثبت امن سفارش...'
            : currentStep === 'payment'
              ? 'پرداخت و ثبت سفارش'
              : 'ادامه'}{' '}
          <Icon name="arrow-left" size={17} />
        </Button>
      </section>
      <OrderSummary cart={cart} quote={quote} />
    </div>
  );
}
