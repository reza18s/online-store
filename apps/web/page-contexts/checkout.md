# Page Context

## Page

**Path:** `src/features/checkout/components/CheckoutView.tsx`

```tsx
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

```

---

## Custom Components


### 1. Button

**Path:** `../../packages/ui/src/button.tsx`

```tsx
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from './cn';

export const buttonVariants = cva(
  'nova-button inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-transparent px-4 text-center text-sm font-semibold leading-5 transition-[background-color,border-color,color,transform] duration-[140ms] ease-out hover:-translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-foreground',
        secondary: 'bg-secondary text-foreground hover:bg-accent-soft hover:text-primary-hover',
        outline:
          'border-primary bg-transparent text-primary hover:border-primary-hover hover:bg-accent-soft hover:text-primary-hover',
        ghost: 'bg-transparent text-foreground hover:bg-secondary',
        destructive: 'bg-destructive text-primary-foreground hover:bg-destructive-hover',
      },
      size: {
        sm: 'min-h-11 px-3 text-[13px]',
        md: 'min-h-12',
        lg: 'min-h-[52px] px-5',
        icon: 'h-11 min-h-11 w-11 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled = false,
      'aria-busy': ariaBusy,
      'aria-disabled': ariaDisabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Component
        aria-busy={loading || ariaBusy || undefined}
        aria-disabled={isDisabled || ariaDisabled || undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        data-loading={loading ? 'true' : undefined}
        disabled={asChild ? disabled : isDisabled}
        ref={ref}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent motion-reduce:animate-none"
          />
        ) : null}
        {asChild ? <Slottable>{children}</Slottable> : children}
      </Component>
    );
  },
);

Button.displayName = 'Button';

```

---


### 2. Input

**Path:** `../../packages/ui/src/input.tsx`

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from './cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'nova-input flex min-h-12 w-full rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

```

---


### 3. Radio

**Path:** `../../packages/ui/src/radio.tsx`

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from './cn';

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Radio = forwardRef<HTMLInputElement, RadioProps>(({ className, ...props }, ref) => (
  <input
    {...props}
    ref={ref}
    type="radio"
    className={cn(
      'nova-radio h-5 w-5 shrink-0 appearance-none rounded-full border border-border bg-background align-middle transition-[background-color,border-color,box-shadow] duration-[140ms] checked:border-[6px] checked:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
      className,
    )}
  />
));

Radio.displayName = 'Radio';

```

---


### 4. Textarea

**Path:** `../../packages/ui/src/textarea.tsx`

```tsx
import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

import { cn } from './cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'nova-textarea min-h-28 w-full resize-y rounded-control border border-border bg-background px-3 py-3 text-sm leading-7 text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';

```

---


### 5. AddressForm

**Path:** `src/features/checkout/components/address-form.tsx`

```tsx
import { type FormEvent } from 'react';
import { type CustomerAddress, type CustomerAddressCreateInput } from '@nova/api-client';
import { Button, Input as UiInput, Radio, Textarea as UiTextarea } from '@nova/ui';

import { type CheckoutFailure } from '@/features/checkout/api/checkout-state';
import { Icon } from '@/shared/ui/icon';

export function AddressForm({
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

```

---


### 6. CartState

**Path:** `src/features/checkout/components/cart-state.tsx`

```tsx
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import type { CheckoutPageProps } from '@/features/checkout/pages/checkout-page-shared';

import { CheckoutShell } from '@/features/checkout/components/checkout-shell';

import { LoadingState } from '@/features/checkout/components/loading-state';

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
            <a href="/products">مشاهده فروشگاه</a>
          </Button>
        </section>
      </CheckoutShell>
    );
  }
  return null;
}

```

---


### 7. CheckoutPageContent

**Path:** `src/features/checkout/components/checkout-page-content.tsx`

```tsx
import type { CartView } from '@nova/api-client';
import { Button } from '@nova/ui';

import type { CheckoutPageProps } from '@/features/checkout/pages/checkout-page-shared';

import { AddressForm } from '@/features/checkout/components/address-form';

import { CheckoutShell } from '@/features/checkout/components/checkout-shell';

import { CheckoutStepPanel } from '@/features/checkout/components/checkout-step-panel';

import { LoadingState } from '@/features/checkout/components/loading-state';

import { OrderSummary } from '@/features/checkout/components/order-summary';

import { useCheckoutPageController } from '@/features/checkout/components/use-checkout-page-controller';

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
            <a href={controller.needsLogin ? '/auth' : '/checkout/address'}>
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
            <a href="/checkout/address">انتخاب آدرس</a>
          </Button>
        </section>
      </CheckoutShell>
    );
  }

  return (
    <CheckoutShell>
      <div className="breadcrumb">
        <a href="/cart">سبد خرید</a>
        <span>/</span>
        <span>تکمیل سفارش</span>
      </div>
      <CheckoutStepPanel controller={controller} cart={cart} />
    </CheckoutShell>
  );
}

```

---


### 8. CheckoutShell

**Path:** `src/features/checkout/components/checkout-shell.tsx`

```tsx
import { type ReactNode } from 'react';

export function CheckoutShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="shell inner-page checkout-page nova-checkout-page"
      dir="rtl"
    >
      {children}
    </main>
  );
}

```

---


### 9. CheckoutStepPanel

**Path:** `src/features/checkout/components/checkout-step-panel.tsx`

```tsx
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
    <div className="checkout-layout">
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
            <label className="checkout-coupon">
              کد تخفیف (اختیاری)
              <UiInput
                className="checkout-coupon__input"
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
          className="checkout-next"
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

```

---


### 10. FailurePanel

**Path:** `src/features/checkout/components/failure-panel.tsx`

```tsx
import { type CheckoutRequestInput } from '@nova/api-client';
import { Button } from '@nova/ui';

import { type CheckoutFailure } from '@/features/checkout/api/checkout-state';
import { Icon } from '@/shared/ui/icon';

import { failureHref } from '@/features/checkout/components/failure-href';

export function FailurePanel({
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
              <a className="text-link" href="/cart">
                بازگشت به سبد
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

```

---


### 11. LoadingState

**Path:** `src/features/checkout/components/loading-state.tsx`

```tsx
import { CheckoutShell } from '@/features/checkout/components/checkout-shell';

export function LoadingState({ label }: { label: string }) {
  return (
    <CheckoutShell>
      <section className="checkout-layout animate-pulse lg:grid" role="status" aria-label={label}>
        <div className="h-96 rounded bg-secondary" />
        <div className="h-64 rounded bg-secondary" />
      </section>
    </CheckoutShell>
  );
}

```

---


### 12. OrderSummary

**Path:** `src/features/checkout/components/order-summary.tsx`

```tsx
import { type CartView, type CheckoutQuote } from '@nova/api-client';

import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

import { formatToman } from '@/shared/utils/format-toman';

export function OrderSummary({
  cart,
  quote,
}: {
  cart: CartView;
  quote: CheckoutQuote | undefined;
}) {
  const subtotal = quote?.subtotalToman ?? cart.subtotalToman;
  const discount = quote?.discountToman ?? 0;
  const total = quote?.totalToman ?? cart.subtotalToman;
  return (
    <aside className="summary-card checkout-summary" aria-label="خلاصه سفارش">
      <span className="section-heading__eyebrow">خلاصه سفارش</span>
      <h2>{formatPersianNumber(cart.itemCount)} کالا</h2>
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
      <a className="text-link" href="/cart">
        ویرایش سبد <Icon name="arrow-left" size={15} />
      </a>
    </aside>
  );
}

```

---


### 13. PaymentOptions

**Path:** `src/features/checkout/components/payment-options.tsx`

```tsx
import { Radio } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

export function PaymentOptions() {
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

```

---


### 14. ShippingOptions

**Path:** `src/features/checkout/components/shipping-options.tsx`

```tsx
import { type CheckoutQuote, type CheckoutShippingMethod } from '@nova/api-client';
import { Radio } from '@nova/ui';

import { formatToman } from '@/shared/utils/format-toman';

export function ShippingOptions({
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

```

---


### 15. Icon

**Path:** `src/shared/ui/icon.tsx`

```tsx
import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'bag'
  | 'bell'
  | 'book'
  | 'calendar'
  | 'check'
  | 'chevron-down'
  | 'close'
  | 'dress'
  | 'edit'
  | 'eye'
  | 'filter'
  | 'grid'
  | 'heart'
  | 'home'
  | 'info'
  | 'instagram'
  | 'layers'
  | 'mail'
  | 'menu'
  | 'more-vertical'
  | 'package'
  | 'plus'
  | 'refresh'
  | 'rotate'
  | 'search'
  | 'send'
  | 'settings'
  | 'shield'
  | 'shirt'
  | 'sparkles'
  | 'tag'
  | 'truck'
  | 'user'
  | 'users'
  | 'warehouse'
  | 'warning';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const iconPaths: Record<IconName, ReactNode> = {
  'arrow-left': <path d="m9 5 7 7-7 7" />,
  'arrow-right': <path d="m15 5-7 7 7 7" />,
  bag: (
    <>
      <path d="M5 8.5h14l-1 11H6l-1-11Z" />
      <path d="M8.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" />
      <path d="M10 21h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M7 3v4M17 3v4M3.5 9h17" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  dress: (
    <>
      <path d="M9 4.5a3 3 0 0 0 6 0" />
      <path d="m9 6-2 4 2 1-3 8h8l-3-8 2-1-2-4" />
      <path d="m15 6 2 4-2 1 3 8h-8" />
    </>
  ),
  edit: (
    <>
      <path d="m4 16.5-.7 4.2 4.2-.7L19 8.5 15.5 5 4 16.5Z" />
      <path d="m13.5 7 3.5 3.5M4 20.5l3.5-3.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  filter: (
    <>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  heart: (
    <path d="M20.8 8.8c0 5.2-8.8 10.4-8.8 10.4S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.3Z" />
  ),
  home: (
    <>
      <path d="m3.5 10.5 8.5-7 8.5 7" />
      <path d="M5.5 9.5v10h13v-10M9 19.5v-5h6v5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5v5M12 7.5h.01" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 5.5L19.5 7" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  'more-vertical': (
    <>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  package: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 7.8 7.5 4.2 7.5-4.2M12 12v9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-13.6-5.7L4 7.5" />
      <path d="M4 4v3.5h3.5M4 13a8 8 0 0 0 13.6 5.7l2.4-2.2" />
      <path d="M20 20v-3.5h-3.5" />
    </>
  ),
  rotate: (
    <>
      <path d="M4 12a8 8 0 0 1 13.6-5.7L20 8.5" />
      <path d="M20 5v3.5h-3.5M20 12a8 8 0 0 1-13.6 5.7L4 15.5" />
      <path d="M4 19v-3.5h3.5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  send: <path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  shield: <path d="M12 3.5 19 6v5.5c0 4.3-2.7 7.7-7 9-4.3-1.3-7-4.7-7-9V6l7-2.5Z" />,
  shirt: (
    <>
      <path d="m8 5 4 2 4-2 4 3-2.5 4-2-1v9h-7v-9l-2 1L4 8l4-3Z" />
      <path d="M10 6.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  sparkles: (
    <>
      <path d="m8 3 1.2 3.8L13 8l-3.8 1.2L8 13l-1.2-3.8L3 8l3.8-1.2L8 3Z" />
      <path d="m17 12 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM17 3v3M18.5 4.5h-3" />
    </>
  ),
  tag: (
    <>
      <path d="M4 4h7l9 9-7 7-9-9V4Z" />
      <circle cx="8" cy="8" r="1" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7V9Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 4 5" />
    </>
  ),
  warehouse: (
    <>
      <path d="m3 9 9-5 9 5v11H3V9Z" />
      <path d="M7 20v-6h10v6M7 10h.01M12 10h.01M17 10h.01" />
    </>
  ),
  warning: (
    <>
      <path d="m12 3 9 16H3l9-16Z" />
      <path d="M12 9v4M12 16h.01" />
    </>
  ),
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

```

---


## Summary

- Page: `src/features/checkout/components/CheckoutView.tsx`
- Custom component files: 15
- Total files included: 16
