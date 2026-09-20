import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ApiClientError,
  type CartView,
  type CheckoutOrder,
  type CheckoutRequestInput,
} from '@nova/api-client';

import {
  useCreateCustomerAddress,
  useCustomerAddresses,
} from '@/features/account/api/addresses-api';

import { useCheckoutQuote, useSubmitCheckout } from '@/features/checkout/api/checkout-api';
import { trackAnalyticsEvent } from '@/shared/analytics/analytics';
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
} from '@/features/checkout/api/checkout-state';

import { emptyAddressDraft, steps } from '@/features/checkout/pages/checkout-page-shared';

import { errorFailure } from '@/features/checkout/components/error-failure';

import { navigate } from '@/features/checkout/components/navigate';

import { recoveryHref } from '@/features/checkout/components/recovery-href';

import { formatPersianNumber } from '@/shared/utils/format-persian-number';

export function useCheckoutPageController({
  step: rawStep,
  queryString = '',
  cart,
}: {
  step: string;
  queryString?: string;
  cart: CartView;
}) {
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
  const addressFailure = addressesQuery.isError
    ? errorFailure(addressesQuery.error, 'دریافت آدرس‌ها ممکن نشد؛ دوباره تلاش کنید.')
    : null;
  const needsLogin =
    addressesQuery.error instanceof ApiClientError && addressesQuery.error.status === 401;
  const quoteQuery = useCheckoutQuote(
    checkoutInput,
    currentStep !== 'address' && Boolean(selectedAddress) && addressesQuery.isSuccess,
  );
  const quoteExpiresAt = quoteQuery.data?.expiresAt;
  const [quoteClock, setQuoteClock] = useState(() => Date.now());
  const checkoutStarted = useRef(false);

  useEffect(() => {
    if (!quoteExpiresAt) return undefined;

    const refreshQuoteClock = () => setQuoteClock(Date.now());
    refreshQuoteClock();
    const interval = window.setInterval(refreshQuoteClock, 1_000);
    return () => window.clearInterval(interval);
  }, [quoteExpiresAt]);

  useEffect(() => {
    if (!quoteQuery.data || checkoutStarted.current) return;
    checkoutStarted.current = true;
    trackAnalyticsEvent({ name: 'checkout_started', properties: { itemCount: cart.itemCount } });
  }, [cart.itemCount, quoteQuery.data]);

  const quoteExpired = isQuoteExpired(quoteQuery.data, quoteClock);
  const quoteRemainingSeconds = quoteExpiresAt
    ? Math.max(0, Math.ceil((Date.parse(quoteExpiresAt) - quoteClock) / 1_000))
    : 0;
  const quoteRemainingLabel = `${formatPersianNumber(
    Math.floor(quoteRemainingSeconds / 60),
  )} دقیقه و ${formatPersianNumber(quoteRemainingSeconds % 60)} ثانیه`;
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

  return {
    currentStep,
    currentIndex,
    addressesQuery,
    createAddressMutation,
    submitMutation,
    selectedAddressId,
    setSelectedAddressId,
    selectedAddress,
    addressFailure,
    needsLogin,
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
    quoteFailure,
    activeFailure,
    retryTarget,
    createAddress,
    stepHref,
    submitOrder,
    goNext,
  };
}

export type CheckoutPageController = ReturnType<typeof useCheckoutPageController>;
