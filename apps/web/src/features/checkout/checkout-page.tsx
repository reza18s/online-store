import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';

import {
  ApiClientError,
  type CartView,
  type CheckoutOrder,
  type CheckoutQuote,
  type CheckoutRequestInput,
  type CheckoutShippingMethod,
  type CustomerAddress,
  type CustomerAddressCreateInput,
  type CustomerOrderDetail,
} from '@nova/api-client';
import { Button, Input as UiInput, Radio, Textarea as UiTextarea } from '@nova/ui';

import { useCreateCustomerAddress, useCustomerAddresses } from '../addresses/addresses-api';
import { useCustomerOrder } from '../orders/orders-api';
import { completeLocalPayment, useCheckoutQuote, useSubmitCheckout } from './checkout-api';
import {
  buildCheckoutHref,
  classifyCheckoutFailure,
  checkoutFormStateFromRoute,
  checkoutRetryTarget,
  getStableCheckoutIdempotencyKey,
  isConfirmedTerminalPaymentStartFailure,
  isQuoteExpired,
  normalizeCheckoutStep,
  parseCheckoutRouteParams,
  paymentRecoveryCopy,
  rotateCheckoutIdempotencyKey,
  shouldShowNewAddressFromRoute,
  shouldShowCheckoutOrderLoading,
  type CheckoutFailure,
  type CheckoutStep,
  type PaymentRecoveryState,
} from './checkout-state';
import { Icon } from '../../shared/icon';

export interface CheckoutPageProps {
  step: string;
  queryString?: string;
  cart: CartView | undefined;
  cartLoading: boolean;
  cartError: boolean;
  onRetryCart: () => void;
}

const emptyAddressDraft: CustomerAddressCreateInput = {
  label: '',
  recipientName: '',
  phone: '',
  province: '',
  city: '',
  addressLine: '',
  postalCode: '',
};

const steps: Array<{ key: CheckoutStep; label: string }> = [
  { key: 'address', label: 'آدرس' },
  { key: 'shipping', label: 'ارسال' },
  { key: 'payment', label: 'پرداخت' },
];

function formatToman(value: number): string {
  return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;
}

function errorFailure(error: unknown, fallback: string): CheckoutFailure {
  const failure = classifyCheckoutFailure(error);
  return failure.kind === 'generic' &&
    failure.message === 'اطلاعات سفارش را بررسی کنید و دوباره تلاش کنید.'
    ? { ...failure, message: fallback }
    : failure;
}

function navigate(href: string): void {
  if (typeof window !== 'undefined') window.location.hash = href.slice(1);
}

function failureHref(failure: CheckoutFailure, input: CheckoutRequestInput): string | undefined {
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

function FailurePanel({
  failure,
  input,
  onRetry,
}: {
  failure: CheckoutFailure;
  input: CheckoutRequestInput;
  onRetry?: () => void;
}) {
  const href = failureHref(failure, input);
  return (
    <div className="mt-5 border border-danger/30 bg-danger/5 p-4" role="alert">
      <div className="flex items-start gap-3">
        <span className="mt-1 text-danger" aria-hidden="true">
          <Icon name="warning" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">{failure.title}</h2>
          <p className="mt-1 text-sm leading-7 text-muted-foreground">{failure.message}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {onRetry ? (
              <Button type="button" variant="outline" onClick={onRetry}>
                {failure.actionLabel}
              </Button>
            ) : href ? (
              <Button asChild type="button" variant="outline">
                <a href={href}>{failure.actionLabel}</a>
              </Button>
            ) : null}
            {failure.action !== 'cart' && failure.action !== 'login' ? (
              <a className="text-link" href="#cart">
                بازگشت به سبد
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="shell inner-page checkout-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background"
      dir="rtl"
    >
      {children}
    </main>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <CheckoutShell>
      <section className="checkout-layout animate-pulse lg:grid" role="status" aria-label={label}>
        <div className="h-96 rounded bg-secondary" />
        <div className="h-64 rounded bg-secondary" />
      </section>
    </CheckoutShell>
  );
}

function CartState({
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

function AddressForm({
  addresses,
  selectedAddressId,
  onSelect,
  showNewAddress,
  onToggleNewAddress,
  draft,
  onDraftChange,
  onCreate,
  creating,
  createFailure,
}: {
  addresses: CustomerAddress[];
  selectedAddressId: string;
  onSelect: (addressId: string) => void;
  showNewAddress: boolean;
  onToggleNewAddress?: () => void;
  draft: CustomerAddressCreateInput;
  onDraftChange: (key: keyof CustomerAddressCreateInput, value: string) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  creating: boolean;
  createFailure: CheckoutFailure | null;
}) {
  return (
    <div className="form-card">
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-semibold">آدرس تحویل</legend>
        {addresses.map((address) => (
          <label
            className={`option-card ${selectedAddressId === address.id ? 'is-selected' : ''}`}
            key={address.id}
          >
            <Radio
              checked={selectedAddressId === address.id}
              name="checkout-address"
              onChange={() => onSelect(address.id)}
            />
            <span className="min-w-0">
              <strong>
                {address.label} {address.isDefault ? '· پیش‌فرض' : ''}
              </strong>
              <small>
                {address.recipientName} · {address.province}، {address.city}، {address.addressLine}
              </small>
              <small dir="ltr">
                {address.phone} · {address.postalCode}
              </small>
            </span>
            <Icon name={selectedAddressId === address.id ? 'check' : 'home'} size={18} />
          </label>
        ))}
      </fieldset>
      {onToggleNewAddress ? (
        <Button
          className="min-h-11 justify-center"
          type="button"
          variant="outline"
          onClick={onToggleNewAddress}
        >
          <Icon name={showNewAddress ? 'close' : 'plus'} size={15} />
          {showNewAddress ? 'بستن فرم آدرس جدید' : 'افزودن آدرس جدید'}
        </Button>
      ) : null}
      {showNewAddress ? (
        <form className="grid gap-3 border-t border-border pt-5" onSubmit={onCreate}>
          <h3 className="text-sm font-semibold">آدرس جدید</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ['label', 'عنوان آدرس', 'مثلاً خانه'],
                ['recipientName', 'نام گیرنده', 'نام و نام خانوادگی'],
                ['phone', 'شماره موبایل', '09...'],
                ['province', 'استان', 'استان'],
                ['city', 'شهر', 'شهر'],
                ['postalCode', 'کد پستی', 'کد پستی'],
              ] as Array<[keyof CustomerAddressCreateInput, string, string]>
            ).map(([key, label, placeholder]) => (
              <label className="grid gap-1 text-sm" key={key}>
                <span>{label}</span>
                <UiInput
                  className="min-h-11 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
                  dir={key === 'phone' || key === 'postalCode' ? 'ltr' : 'rtl'}
                  required
                  value={typeof draft[key] === 'string' ? draft[key] : ''}
                  placeholder={placeholder}
                  autoComplete={
                    key === 'phone' ? 'tel' : key === 'postalCode' ? 'postal-code' : 'off'
                  }
                  onChange={(event) => onDraftChange(key, event.target.value)}
                />
              </label>
            ))}
          </div>
          <label className="grid gap-1 text-sm">
            <span>نشانی کامل</span>
            <UiTextarea
              className="border border-border bg-background px-3 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
              required
              rows={3}
              value={draft.addressLine}
              onChange={(event) => onDraftChange('addressLine', event.target.value)}
            />
          </label>
          {createFailure ? (
            <p className="text-sm leading-7 text-danger" role="alert">
              {createFailure.message}
            </p>
          ) : null}
          <Button disabled={creating} className="min-h-11" type="submit">
            {creating ? 'در حال ذخیره آدرس...' : 'ذخیره و انتخاب آدرس'}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function ShippingOptions({
  value,
  onChange,
  quote,
}: {
  value: CheckoutShippingMethod;
  onChange: (value: CheckoutShippingMethod) => void;
  quote: CheckoutQuote | undefined;
}) {
  return (
    <fieldset className="option-list">
      <legend className="mb-3 text-sm font-semibold">روش ارسال را انتخاب کنید</legend>
      {(['STANDARD', 'EXPRESS'] as CheckoutShippingMethod[]).map((method) => (
        <label className={`option-card ${value === method ? 'is-selected' : ''}`} key={method}>
          <Radio checked={value === method} name="shipping" onChange={() => onChange(method)} />
          <span>
            <strong>{method === 'STANDARD' ? 'ارسال عادی' : 'ارسال سریع'}</strong>
            <small>
              {value === method && quote
                ? `${quote.shippingEstimate} · ${quote.shippingLabel}`
                : 'هزینه و زمان تحویل پس از بررسی آدرس از سرور دریافت می‌شود.'}
            </small>
          </span>
          {value === method && quote ? <b>{formatToman(quote.shippingToman)}</b> : null}
        </label>
      ))}
    </fieldset>
  );
}

function PaymentOptions() {
  return (
    <fieldset className="option-list">
      <legend className="mb-3 text-sm font-semibold">روش پرداخت</legend>
      <label className="option-card is-selected">
        <Radio name="payment" defaultChecked aria-label="پرداخت آنلاین" />
        <span>
          <strong>پرداخت آنلاین</strong>
          <small>پس از ثبت امن سفارش، در صورت فعال‌بودن درگاه به آن منتقل می‌شوید.</small>
        </span>
        <Icon name="check" size={18} />
      </label>
      <div className="inline-message inline-message--info" role="status">
        <Icon name="info" size={16} />
        وضعیت پرداخت پس از بازگشت، فقط از روی سفارش معتبر سرور نمایش داده می‌شود.
      </div>
    </fieldset>
  );
}

function OrderSummary({ cart, quote }: { cart: CartView; quote: CheckoutQuote | undefined }) {
  const subtotal = quote?.subtotalToman ?? cart.subtotalToman;
  const discount = quote?.discountToman ?? 0;
  const total = quote?.totalToman ?? cart.subtotalToman;
  return (
    <aside className="summary-card checkout-summary" aria-label="خلاصه سفارش">
      <span className="section-heading__eyebrow">خلاصه سفارش</span>
      <h2>{new Intl.NumberFormat('fa-IR').format(cart.itemCount)} کالا</h2>
      <div>
        <span>مبلغ کالاها</span>
        <strong>{formatToman(subtotal)}</strong>
      </div>
      {quote && discount ? (
        <div>
          <span>تخفیف</span>
          <strong className="text-success">− {formatToman(discount)}</strong>
        </div>
      ) : null}
      <div>
        <span>ارسال</span>
        <strong>{quote ? formatToman(quote.shippingToman) : 'پس از تأیید آدرس'}</strong>
      </div>
      <div className="summary-card__total">
        <span>مبلغ نهایی</span>
        <strong>{quote ? formatToman(total) : 'پس از دریافت قیمت'}</strong>
      </div>
      {quote ? (
        <p className="mb-3 text-xs leading-7 text-muted-foreground">
          {quote.shippingLabel} · {quote.shippingEstimate}
        </p>
      ) : null}
      <a className="text-link" href="#cart">
        ویرایش سبد <Icon name="arrow-left" size={15} />
      </a>
    </aside>
  );
}

function recoveryHref(state: PaymentRecoveryState, orderNumber: string): string {
  const params = new URLSearchParams({ orderNumber, paymentState: state });
  return `#checkout/payment-recovery?${params.toString()}`;
}

function paymentStateForOrder(order: CustomerOrderDetail): PaymentRecoveryState | null {
  if (order.paymentStatus === 'PAID' || order.status === 'CONFIRMED') return null;
  switch (order.payment?.status) {
    case 'FAILED':
      return 'failed';
    case 'CANCELLED':
      return 'cancelled';
    case 'EXPIRED':
      return 'timeout';
    default:
      return 'pending';
  }
}

function ConfirmationBody({ order }: { order: CustomerOrderDetail }) {
  return (
    <section className="confirmation-card" aria-labelledby="checkout-confirmation-title">
      <span className="confirmation-card__icon" aria-hidden="true">
        <Icon name="check" size={28} />
      </span>
      <span className="section-heading__eyebrow">NOVA / ORDER CONFIRMED</span>
      <h1 id="checkout-confirmation-title">سفارش شما با موفقیت تأیید شد</h1>
      <p>جزئیات زیر از سفارش ثبت‌شده در حساب شما دریافت شده است.</p>
      <strong className="ltr-value" dir="ltr">
        {order.orderNumber}
      </strong>
      <div className="mt-5 grid gap-2 border-y border-border py-4 text-sm">
        <div className="flex justify-between gap-4">
          <span>وضعیت پرداخت</span>
          <strong>پرداخت‌شده</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span>مبلغ نهایی</span>
          <strong>{formatToman(order.totalToman)}</strong>
        </div>
      </div>
      <div className="confirmation-card__actions">
        <Button asChild size="lg">
          <a href={`#order/${encodeURIComponent(order.orderNumber)}`}>پیگیری سفارش</a>
        </Button>
        <a className="text-link" href="#home">
          بازگشت به خانه <Icon name="arrow-left" size={16} />
        </a>
      </div>
    </section>
  );
}

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

function CheckoutPageContent({
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

function OrderRecoveryState({
  order,
  state,
  refetch,
}: {
  order: CustomerOrderDetail;
  state: PaymentRecoveryState;
  refetch: () => void;
}) {
  if (order.paymentStatus === 'PAID' || order.status === 'CONFIRMED')
    return <ConfirmationBody order={order} />;
  const authoritativeState = paymentStateForOrder(order) ?? state;
  const authoritativeCopy = paymentRecoveryCopy(authoritativeState);
  const authoritativeActionHref =
    authoritativeState === 'timeout'
      ? `#order/${encodeURIComponent(order.orderNumber)}`
      : buildCheckoutHref('payment', { addressId: '', shippingMethod: 'STANDARD' });
  return (
    <section className="confirmation-card" aria-labelledby="payment-recovery-title">
      <span className="confirmation-card__icon" aria-hidden="true">
        <Icon name={authoritativeState === 'pending' ? 'refresh' : 'warning'} size={28} />
      </span>
      <span className="section-heading__eyebrow">NOVA / PAYMENT RECOVERY</span>
      <h1 id="payment-recovery-title">{authoritativeCopy.title}</h1>
      <p>{authoritativeCopy.message}</p>
      <strong className="ltr-value" dir="ltr">
        {order.orderNumber}
      </strong>
      <div className="confirmation-card__actions">
        {authoritativeState === 'pending' ? (
          <Button type="button" size="lg" onClick={refetch}>
            {authoritativeCopy.actionLabel}
          </Button>
        ) : (
          <Button asChild size="lg">
            <a href={authoritativeActionHref}>{authoritativeCopy.actionLabel}</a>
          </Button>
        )}
        <Button asChild variant="outline" size="lg">
          <a href={`#order/${encodeURIComponent(order.orderNumber)}`}>مشاهده وضعیت سفارش</a>
        </Button>
      </div>
    </section>
  );
}

function OrderLookupState({ error, retry }: { error: unknown; retry: () => void }) {
  const failure = errorFailure(error, 'وضعیت سفارش دریافت نشد.');
  const needsLogin = error instanceof ApiClientError && error.status === 401;
  return (
    <section className="confirmation-card" role="alert">
      <Icon name="warning" size={28} />
      <h1>{needsLogin ? 'برای مشاهده نتیجه وارد شوید' : failure.title}</h1>
      <p>{needsLogin ? 'سفارش فقط برای حساب صاحب آن قابل مشاهده است.' : failure.message}</p>
      <div className="confirmation-card__actions">
        <Button asChild size="lg">
          <a href={needsLogin ? '#auth' : '#account/orders'}>
            {needsLogin ? 'ورود به حساب' : 'مشاهده سفارش‌ها'}
          </a>
        </Button>
        {!needsLogin ? (
          <Button type="button" variant="outline" size="lg" onClick={retry}>
            تلاش دوباره
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export function CheckoutPaymentRecoveryPage({ queryString = '' }: { queryString?: string }) {
  const params = parseCheckoutRouteParams(queryString);
  const state = params.paymentState ?? 'recovery';
  const orderQuery = useCustomerOrder(params.orderNumber, Boolean(params.orderNumber));
  return (
    <CheckoutShell>
      <div className="breadcrumb">
        <a href="#account/orders">سفارش‌ها</a>
        <span>/</span>
        <span>بازیابی پرداخت</span>
      </div>
      {shouldShowCheckoutOrderLoading(params.orderNumber, orderQuery.isPending) ? (
        <section
          className="mx-auto max-w-2xl animate-pulse border border-border bg-surface p-8"
          role="status"
          aria-label="در حال بررسی وضعیت پرداخت"
        >
          <div className="mx-auto h-14 w-14 rounded-full bg-secondary" />
          <div className="mx-auto mt-5 h-7 max-w-sm rounded bg-secondary" />
          <div className="mx-auto mt-3 h-4 max-w-md rounded bg-secondary" />
        </section>
      ) : !params.orderNumber ? (
        <OrderLookupState
          error={new Error('شماره سفارش در لینک پرداخت وجود ندارد.')}
          retry={() => undefined}
        />
      ) : orderQuery.isError || !orderQuery.data ? (
        <OrderLookupState error={orderQuery.error} retry={() => void orderQuery.refetch()} />
      ) : (
        <OrderRecoveryState
          order={orderQuery.data}
          state={state}
          refetch={() => void orderQuery.refetch()}
        />
      )}
    </CheckoutShell>
  );
}

export function LocalPaymentPage({ queryString = '' }: { queryString?: string }) {
  const params = new URLSearchParams(queryString);
  const orderNumber = params.get('orderNumber') ?? '';
  const amountValue = params.get('amountToman') ?? '';
  const transactionId = params.get('transactionId') ?? '';
  const token = params.get('token') ?? '';
  const amountToman = Number(amountValue);
  const [error, setError] = useState('');

  useEffect(() => {
    if (
      !orderNumber ||
      !transactionId ||
      !token ||
      !Number.isSafeInteger(amountToman) ||
      amountToman < 1
    ) {
      setError('لینک پرداخت محلی کامل نیست؛ سفارش شما تغییر نکرده است.');
      return;
    }

    let active = true;
    void completeLocalPayment({ orderNumber, amountToman, transactionId, token })
      .then((result) => {
        if (!active) return;
        if (result.outcome === 'PAID' || result.outcome === 'DUPLICATE') {
          window.location.hash = `#checkout/confirmation?orderNumber=${encodeURIComponent(orderNumber)}`;
          return;
        }
        setError('پرداخت محلی تأیید نشد؛ وضعیت سفارش خود را بررسی کنید.');
      })
      .catch(() => {
        if (active) setError('تکمیل پرداخت محلی ممکن نشد؛ دوباره تلاش کنید.');
      });

    return () => {
      active = false;
    };
  }, [amountToman, orderNumber, token, transactionId]);

  return (
    <CheckoutShell>
      <section
        className="mx-auto flex min-h-[55svh] max-w-xl flex-col items-center justify-center border border-border bg-surface p-8 text-center shadow-card"
        role={error ? 'alert' : 'status'}
      >
        <Icon name={error ? 'warning' : 'shield'} size={24} />
        <h1 className="mt-4 text-xl">{error ? 'پرداخت انجام نشد' : 'در حال تکمیل پرداخت محلی'}</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          {error || 'پرداخت آزمایشی بدون اتصال به درگاه خارجی در حال ثبت است.'}
        </p>
        {error ? (
          <Button className="mt-5" asChild variant="outline">
            <a href={`#checkout/payment-recovery?orderNumber=${encodeURIComponent(orderNumber)}`}>
              بررسی وضعیت سفارش
            </a>
          </Button>
        ) : null}
      </section>
    </CheckoutShell>
  );
}

export function CheckoutConfirmationPage({ queryString = '' }: { queryString?: string }) {
  const params = parseCheckoutRouteParams(queryString);
  const orderQuery = useCustomerOrder(params.orderNumber, Boolean(params.orderNumber));
  return (
    <CheckoutShell>
      <div className="breadcrumb">
        <a href="#account/orders">سفارش‌ها</a>
        <span>/</span>
        <span>تأیید سفارش</span>
      </div>
      {shouldShowCheckoutOrderLoading(params.orderNumber, orderQuery.isPending) ? (
        <section
          className="mx-auto max-w-2xl animate-pulse border border-border bg-surface p-8"
          role="status"
          aria-label="در حال دریافت سفارش ثبت‌شده"
        >
          <div className="mx-auto h-14 w-14 rounded-full bg-secondary" />
          <div className="mx-auto mt-5 h-7 max-w-sm rounded bg-secondary" />
          <div className="mx-auto mt-3 h-4 max-w-md rounded bg-secondary" />
        </section>
      ) : !params.orderNumber ? (
        <OrderLookupState error={new Error('شماره سفارش معتبر نیست.')} retry={() => undefined} />
      ) : orderQuery.isError || !orderQuery.data ? (
        <OrderLookupState error={orderQuery.error} retry={() => void orderQuery.refetch()} />
      ) : paymentStateForOrder(orderQuery.data) ? (
        <OrderRecoveryState
          order={orderQuery.data}
          state={paymentStateForOrder(orderQuery.data) ?? 'recovery'}
          refetch={() => void orderQuery.refetch()}
        />
      ) : (
        <ConfirmationBody order={orderQuery.data} />
      )}
    </CheckoutShell>
  );
}
