import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ApiClientError,
  type CartView,
  type CheckoutOrder,
  type CheckoutRequestInput,
} from '@nova/api-client';
import { Button, Input as UiInput } from '@nova/ui';
import {
  useCreateCustomerAddress,
  useCustomerAddresses,
} from '../../../lib/addresses/addresses-api';

import { useCheckoutQuote, useSubmitCheckout } from '../../../lib/checkout/checkout-api';
import {
  buildCheckoutHref,
  checkoutFormStateFromRoute,
  checkoutRetryTarget,
  getStableCheckoutIdempotencyKey,
  isConfirmedTerminalPaymentStartFailure,
  isQuoteExpired,
  normalizeCheckoutStep,
  parseCheckoutRouteParams,
  rotateCheckoutIdempotencyKey,
  shouldShowNewAddressFromRoute,
  type CheckoutFailure,
  type CheckoutStep,
} from '../../../lib/checkout/checkout-state';
import { Icon } from '../../ui/icon';

import type { CheckoutPageProps } from '../../../pages/checkout/checkout-page-shared';
import { emptyAddressDraft, steps } from '../../../pages/checkout/checkout-page-shared';

import { AddressForm } from './address-form';

import { CheckoutShell } from './checkout-shell';

import { FailurePanel } from './failure-panel';

import { LoadingState } from './loading-state';

import { OrderSummary } from './order-summary';

import { PaymentOptions } from './payment-options';

import { ShippingOptions } from './shipping-options';

import { errorFailure } from './error-failure';

import { navigate } from './navigate';

import { recoveryHref } from './recovery-href';

export function CheckoutPageContent({
  step: rawStep,
  queryString = '',
  cart,
}: CheckoutPageProps & { cart: CartView }) {
  const currentStep = normalizeCheckoutStep(rawStep);
  const params = parseCheckoutRouteParams(queryString);
  const routeState = checkoutFormStateFromRoute(params);
  const routeShowsNewAddress = shouldShowNewAddressFromRoute(queryString);
  const addressesQuery = useCustomerAddresses();
  const createAddressMutation = useCreateCustomerAddress();
  const submitMutation = useSubmitCheckout();
  const [selectedAddressId, setSelectedAddressId] = useState(routeState.addressId);
  const [shippingMethod, setShippingMethod] = useState(routeState.shippingMethod);
  const [couponCode, setCouponCode] = useState(routeState.couponCode);
  const [showNewAddress, setShowNewAddress] = useState(routeShowsNewAddress);
  const [addressDraft, setAddressDraft] = useState(emptyAddressDraft);
  const [failure, setFailure] = useState<CheckoutFailure | null>(null);
  const [failureSource, setFailureSource] = useState<'quote' | 'submit' | 'address' | null>(null);
  const [retryWithFreshIdempotencyKey, setRetryWithFreshIdempotencyKey] = useState(false);

  useEffect(() => {
    if (selectedAddressId || !addressesQuery.data?.length) return;
    setSelectedAddressId(
      addressesQuery.data.find((address) => address.isDefault)?.id ??
        addressesQuery.data[0]?.id ??
        '',
    );
  }, [addressesQuery.data, selectedAddressId]);

  useEffect(() => {
    setSelectedAddressId(routeState.addressId);
    setCouponCode(routeState.couponCode);
    setShippingMethod(routeState.shippingMethod);
  }, [routeState.addressId, routeState.couponCode, routeState.shippingMethod]);

  useEffect(() => {
    setShowNewAddress(routeShowsNewAddress);
  }, [routeShowsNewAddress]);

  const addressId = selectedAddressId;
  const checkoutInput = useMemo<CheckoutRequestInput>(
    () => ({
      addressId,
      shippingMethod,
      ...(couponCode.trim() ? { couponCode: couponCode.trim() } : {}),
    }),
    [addressId, couponCode, shippingMethod],
  );
  const selectedAddress = addressesQuery.data?.find((address) => address.id === addressId);
  const quoteQuery = useCheckoutQuote(
    checkoutInput,
    currentStep !== 'address' && Boolean(selectedAddress) && addressesQuery.isSuccess,
  );
  const quoteExpired = isQuoteExpired(quoteQuery.data);
  const quoteFailure = quoteExpired
    ? ({
        kind: 'quote-expired',
        title: 'قیمت سفارش منقضی شده است',
        message: 'برای جلوگیری از مبلغ نادرست، قیمت به‌روز را پیش از ادامه دریافت کنید.',
        actionLabel: 'دریافت قیمت جدید',
        action: 'retry',
      } satisfies CheckoutFailure)
    : quoteQuery.isError
      ? errorFailure(quoteQuery.error, 'دریافت قیمت نهایی سفارش ممکن نشد.')
      : null;
  const quote = quoteExpired ? undefined : quoteQuery.data;
  const currentIndex = steps.findIndex((item) => item.key === currentStep);

  const setFailureFrom = (next: CheckoutFailure, source: 'quote' | 'submit' | 'address') => {
    setFailure(next);
    setFailureSource(source);
  };

  const createAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    setFailureSource(null);
    try {
      const address = await createAddressMutation.mutateAsync(addressDraft);
      setSelectedAddressId(address.id);
      setAddressDraft(emptyAddressDraft);
      setShowNewAddress(false);
      setRetryWithFreshIdempotencyKey(false);
    } catch (error) {
      setFailureFrom(
        errorFailure(error, 'ذخیره آدرس انجام نشد؛ اطلاعات واردشده حفظ شده است.'),
        'address',
      );
    }
  };

  if (addressesQuery.isPending) return <LoadingState label="در حال بارگذاری آدرس‌ها" />;
  if (addressesQuery.isError) {
    const addressFailure = errorFailure(
      addressesQuery.error,
      'دریافت آدرس‌ها ممکن نشد؛ دوباره تلاش کنید.',
    );
    const needsLogin =
      addressesQuery.error instanceof ApiClientError && addressesQuery.error.status === 401;
    return (
      <CheckoutShell>
        <section className="mx-auto max-w-xl border border-border bg-surface p-8 text-center shadow-card">
          <h1 className="text-xl">
            {needsLogin ? 'برای تکمیل خرید وارد شوید' : addressFailure.title}
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {needsLogin
              ? 'برای انتخاب آدرس و ثبت سفارش، ابتدا وارد حساب خود شوید.'
              : addressFailure.message}
          </p>
          <Button className="mt-5" asChild variant="outline">
            <a href={needsLogin ? '#auth' : '#checkout/address'}>
              {needsLogin ? 'ورود به حساب' : 'تلاش دوباره'}
            </a>
          </Button>
        </section>
      </CheckoutShell>
    );
  }
  if (!addressesQuery.data?.length) {
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
              draft={addressDraft}
              onDraftChange={(key, value) =>
                setAddressDraft((current) => ({ ...current, [key]: value }))
              }
              onCreate={(event) => void createAddress(event)}
              creating={createAddressMutation.isPending}
              createFailure={failureSource === 'address' ? failure : null}
            />
          </section>
          <OrderSummary cart={cart} quote={undefined} />
        </div>
      </CheckoutShell>
    );
  }
  if (currentStep !== 'address' && !selectedAddress) {
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

  const stepHref = (target: CheckoutStep) => buildCheckoutHref(target, checkoutInput);
  const submitOrder = async () => {
    setFailure(null);
    setFailureSource(null);
    if (!quote || quoteExpired) {
      if (quoteFailure) setFailureFrom(quoteFailure, 'quote');
      return;
    }
    try {
      const idempotencyKey = retryWithFreshIdempotencyKey
        ? rotateCheckoutIdempotencyKey(checkoutInput, quote)
        : getStableCheckoutIdempotencyKey(checkoutInput, quote);
      setRetryWithFreshIdempotencyKey(false);
      const order = await submitMutation.mutateAsync({
        input: checkoutInput,
        idempotencyKey,
      });
      handleCheckoutOrder(order);
    } catch (error) {
      setRetryWithFreshIdempotencyKey(isConfirmedTerminalPaymentStartFailure(error));
      setFailureFrom(
        errorFailure(
          error,
          'نتیجه ثبت سفارش قطعی نیست؛ ممکن است تلاش لغوشده‌ای در حساب شما ثبت شده باشد.',
        ),
        'submit',
      );
    }
  };
  const handleCheckoutOrder = (order: CheckoutOrder) => {
    if (order.payment.redirectUrl) {
      navigate(recoveryHref('redirecting', order.orderNumber));
      if (typeof window !== 'undefined') window.location.assign(order.payment.redirectUrl);
      return;
    }
    switch (order.payment.status) {
      case 'SUCCEEDED':
        navigate(`#checkout/confirmation?orderNumber=${encodeURIComponent(order.orderNumber)}`);
        return;
      case 'FAILED':
        navigate(recoveryHref('failed', order.orderNumber));
        return;
      case 'CANCELLED':
        navigate(recoveryHref('cancelled', order.orderNumber));
        return;
      case 'EXPIRED':
        navigate(recoveryHref('timeout', order.orderNumber));
        return;
      default:
        navigate(recoveryHref('pending', order.orderNumber));
    }
  };
  const goNext = () => {
    if (currentStep === 'address') {
      if (!selectedAddress) {
        setFailureFrom(
          {
            kind: 'invalid-address',
            title: 'آدرس تحویل را انتخاب کنید',
            message: 'برای دریافت قیمت نهایی، یک آدرس معتبر انتخاب کنید.',
            actionLabel: 'انتخاب آدرس',
            action: 'address',
          },
          'address',
        );
        return;
      }
      navigate(stepHref('shipping'));
      return;
    }
    if (quoteFailure) {
      setFailureFrom(quoteFailure, 'quote');
      return;
    }
    if (currentStep === 'shipping') {
      navigate(stepHref('payment'));
      return;
    }
    void submitOrder();
  };
  const activeFailure =
    failureSource === 'submit' || failureSource === 'address' ? failure : quoteFailure;
  const retryTarget = checkoutRetryTarget(activeFailure, failureSource);
  return (
    <CheckoutShell>
      <div className="breadcrumb">
        <a href="#cart">سبد خرید</a>
        <span>/</span>
        <span>تکمیل سفارش</span>
      </div>
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
              addresses={addressesQuery.data}
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
                  <Icon name="check" size={16} /> کد <span dir="ltr">{quote.coupon.code}</span>{' '}
                  اعمال شد.
                </div>
              ) : couponCode.trim() && quote && !quoteQuery.isPending ? (
                <div className="inline-message inline-message--error" role="alert">
                  <Icon name="warning" size={16} /> این کد تخفیف اعمال نشد؛ مبلغ به‌روز را بررسی
                  کنید.
                </div>
              ) : null}
            </>
          )}
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
              (currentStep === 'address' && !selectedAddress) ||
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
        <OrderSummary cart={cart as CartView} quote={quote} />
      </div>
    </CheckoutShell>
  );
}
