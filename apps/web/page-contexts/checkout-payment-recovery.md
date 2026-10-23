# Page Context

## Page

**Path:** `src/features/checkout/components/checkout-payment-recovery-page.tsx`

```tsx
import { useCustomerOrder } from '@/features/orders/api/orders-api';

import {
  parseCheckoutRouteParams,
  shouldShowCheckoutOrderLoading,
} from '@/features/checkout/api/checkout-state';

import { CheckoutShell } from '@/features/checkout/components/checkout-shell';

import { OrderLookupState } from '@/features/checkout/components/order-lookup-state';

import { OrderRecoveryState } from '@/features/checkout/components/order-recovery-state';

export function CheckoutPaymentRecoveryPage({ queryString = '' }: { queryString?: string }) {
  const params = parseCheckoutRouteParams(queryString);
  const state = params.paymentState ?? 'recovery';
  const orderQuery = useCustomerOrder(params.orderNumber, Boolean(params.orderNumber));
  return (
    <CheckoutShell>
      <div className="breadcrumb">
        <a href="/account/orders">سفارش‌ها</a>
        <span>/</span>
        <span>بازیابی پرداخت</span>
      </div>
      {shouldShowCheckoutOrderLoading(params.orderNumber, orderQuery.isPending) ? (
        <section
          className="checkout-state-card is-loading"
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


### 2. CheckoutShell

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


### 3. ConfirmationBody

**Path:** `src/features/checkout/components/confirmation-body.tsx`

```tsx
import { type CustomerOrderDetail } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import { formatToman } from '@/shared/utils/format-toman';

export function ConfirmationBody({ order }: { order: CustomerOrderDetail }) {
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
          <a href={`/order/${encodeURIComponent(order.orderNumber)}`}>پیگیری سفارش</a>
        </Button>
        <a className="text-link" href="/">
          بازگشت به خانه <Icon name="arrow-left" size={16} />
        </a>
      </div>
    </section>
  );
}

```

---


### 4. OrderLookupState

**Path:** `src/features/checkout/components/order-lookup-state.tsx`

```tsx
import { ApiClientError } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import { errorFailure } from '@/features/checkout/components/error-failure';

export function OrderLookupState({ error, retry }: { error: unknown; retry: () => void }) {
  const failure = errorFailure(error, 'وضعیت سفارش دریافت نشد.');
  const needsLogin = error instanceof ApiClientError && error.status === 401;
  return (
    <section className="confirmation-card" role="alert">
      <Icon name="warning" size={28} />
      <h1>{needsLogin ? 'برای مشاهده نتیجه وارد شوید' : failure.title}</h1>
      <p>{needsLogin ? 'سفارش فقط برای حساب صاحب آن قابل مشاهده است.' : failure.message}</p>
      <div className="confirmation-card__actions">
        <Button asChild size="lg">
          <a href={needsLogin ? '/auth' : '/account/orders'}>
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

```

---


### 5. OrderRecoveryState

**Path:** `src/features/checkout/components/order-recovery-state.tsx`

```tsx
import { type CustomerOrderDetail } from '@nova/api-client';
import { Button } from '@nova/ui';

import {
  buildCheckoutHref,
  paymentRecoveryCopy,
  type PaymentRecoveryState,
} from '@/features/checkout/api/checkout-state';
import { Icon } from '@/shared/ui/icon';

import { ConfirmationBody } from '@/features/checkout/components/confirmation-body';

import { paymentStateForOrder } from '@/features/checkout/components/payment-state-for-order';

export function OrderRecoveryState({
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
      ? `/order/${encodeURIComponent(order.orderNumber)}`
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
          <a href={`/order/${encodeURIComponent(order.orderNumber)}`}>مشاهده وضعیت سفارش</a>
        </Button>
      </div>
    </section>
  );
}

```

---


### 6. Icon

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

- Page: `src/features/checkout/components/checkout-payment-recovery-page.tsx`
- Custom component files: 6
- Total files included: 7
