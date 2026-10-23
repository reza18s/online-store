# Page Context

## Page

**Path:** `src/features/cart/components/CartView.tsx`

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';
import {
  toStorefrontProduct,
  useCatalogProducts,
  type StorefrontProduct,
} from '@/features/catalog/api/catalog-api';
import {
  getCartMergeConflicts,
  shouldMergeGuestCart,
  useAddCartItem,
  useCart,
  useMergeGuestCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from '@/features/cart/api/cart-api';
import { useCartUiStore } from '@/features/cart/api/cart-ui-store';

import type { StorefrontCartPageProps } from '@/features/cart/pages/storefront-cart-page-shared';

import { CartLineView } from '@/features/cart/components/cart-line-view';

import { CartRefreshNotice } from '@/features/cart/components/cart-refresh-notice';

import { CartSkeleton } from '@/features/cart/components/cart-skeleton';

import { MergeConflictNotice } from '@/features/cart/components/merge-conflict-notice';

import { MessageCard } from '@/features/cart/components/message-card';

import { RecommendationCard } from '@/features/cart/components/recommendation-card';

import { cartActionErrorMessage } from '@/features/cart/components/cart-action-error-message';

import { cartLineTotal } from '@/features/cart/components/cart-line-total';

import { formatToman } from '@/shared/utils/format-toman';

export function CartView(props: StorefrontCartPageProps) {
  const controlled =
    props.cart !== undefined || props.isLoading !== undefined || props.isError !== undefined;
  const cartQuery = useCart(!controlled);
  const cart = props.cart ?? cartQuery.data;
  const isLoading = props.isLoading ?? cartQuery.isPending;
  const isError = props.isError ?? cartQuery.isError;
  const retry = props.onRetry ?? (() => void cartQuery.refetch());
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const addMutation = useAddCartItem();
  const mergeMutation = useMergeGuestCart();
  const recommendationsQuery = useCatalogProducts({ limit: 4, sort: 'newest' });
  const [busyVariantId, setBusyVariantId] = useState('');
  const feedback = useCartUiStore((state) => state.feedback);
  const mergeConflicts = useCartUiStore((state) => state.mergeConflicts);
  const mergeResolutions = useCartUiStore((state) => state.mergeResolutions);
  const setFeedback = useCartUiStore((state) => state.setFeedback);
  const setMergeConflicts = useCartUiStore((state) => state.setMergeConflicts);
  const setMergeResolution = useCartUiStore((state) => state.setMergeResolution);
  const resetMergeState = useCartUiStore((state) => state.resetMergeState);
  const resetCartUi = useCartUiStore((state) => state.reset);
  const mergeAttempt = useRef<string | undefined>(undefined);
  const isBusy = Boolean(busyVariantId) || addMutation.isPending || mergeMutation.isPending;
  const mergeEnabled = props.enableGuestMerge ?? true;
  const guestMergeActive = mergeEnabled && Boolean(props.customerId && cart?.kind === 'GUEST');

  useEffect(() => {
    return () => resetCartUi();
  }, [resetCartUi]);

  const handleMergeSuccess = () => {
    resetMergeState();
  };
  const handleMergeError = (error: unknown) => {
    const conflicts = getCartMergeConflicts(error);
    if (conflicts.length) setMergeConflicts(conflicts);
    else setFeedback({ message: cartActionErrorMessage(error), error: true });
  };
  const resolveMergeConflict = (variantId: string, quantity: number) => {
    setFeedback(undefined);
    const nextResolutions = { ...mergeResolutions, [variantId]: quantity };
    setMergeResolution(variantId, quantity);
    mergeMutation.mutate(
      {
        resolutions: Object.entries(nextResolutions).map(
          ([resolvedVariantId, resolvedQuantity]) => ({
            variantId: resolvedVariantId,
            quantity: resolvedQuantity,
          }),
        ),
      },
      { onSuccess: handleMergeSuccess, onError: handleMergeError },
    );
  };

  useEffect(() => {
    if (
      !mergeEnabled ||
      !props.customerId ||
      !cart ||
      !shouldMergeGuestCart(cart, props.customerId)
    )
      return;
    const attemptKey = `${props.customerId}:${cart.id ?? 'guest'}`;
    if (mergeAttempt.current === attemptKey || mergeMutation.isPending) return;
    mergeAttempt.current = attemptKey;
    mergeMutation.mutate(
      { resolutions: [] },
      { onSuccess: handleMergeSuccess, onError: handleMergeError },
    );
  }, [cart, mergeEnabled, mergeMutation, props.customerId]);

  const updateItem = (variantId: string, quantity: number) => {
    setFeedback(undefined);
    setBusyVariantId(variantId);
    if (props.onUpdateItem) {
      props.onUpdateItem(variantId, quantity);
      setBusyVariantId('');
      return;
    }
    updateMutation.mutate(
      { variantId, quantity },
      {
        onSuccess: () => setBusyVariantId(''),
        onError: (error) => {
          setBusyVariantId('');
          setFeedback({ message: cartActionErrorMessage(error), error: true });
        },
      },
    );
  };
  const removeItem = (variantId: string) => {
    setFeedback(undefined);
    setBusyVariantId(variantId);
    if (props.onRemoveItem) {
      props.onRemoveItem(variantId);
      setBusyVariantId('');
      return;
    }
    removeMutation.mutate(variantId, {
      onSuccess: () => setBusyVariantId(''),
      onError: (error) => {
        setBusyVariantId('');
        setFeedback({ message: cartActionErrorMessage(error), error: true });
      },
    });
  };
  const addRecommendation = (product: StorefrontProduct) => {
    const variant = product.variants?.find((item) => item.available);
    if (!variant) {
      setFeedback({ message: 'این پیشنهاد بدون انتخاب تنوع قابل افزودن نیست.', error: true });
      return;
    }
    addMutation.mutate(
      { variantId: variant.id, quantity: 1, idempotencyKey: globalThis.crypto?.randomUUID?.() },
      {
        onSuccess: () => setFeedback({ message: `«${product.name}» به سبد خرید اضافه شد.` }),
        onError: (error) => setFeedback({ message: cartActionErrorMessage(error), error: true }),
      },
    );
  };
  const summaryRows = useMemo(
    () => cart?.items.map((line) => ({ ...line, total: cartLineTotal(line) })) ?? [],
    [cart],
  );

  if (isLoading && !cart)
    return (
      <main className="shell mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background py-6 md:py-10">
        <CartSkeleton />
      </main>
    );
  if (!cart)
    return (
      <main className="shell mx-auto flex min-h-[55svh] w-[calc(100%-2rem)] max-w-[1280px] items-center bg-background py-8">
        <MessageCard
          title="سبد خرید بارگذاری نشد"
          description="لطفاً اتصال خود را بررسی کنید و دوباره تلاش کنید."
          action="تلاش دوباره"
          onAction={retry}
        />
      </main>
    );
  if (!cart.items.length)
    return (
      <main className="shell mx-auto w-[calc(100%-2rem)] max-w-[1280px] space-y-6 bg-background py-8 md:py-12">
        <header className="simple-page-header">
          <span className="section-heading__eyebrow">NOVA / CART</span>
          <h1>سبد خرید</h1>
        </header>
        {isError ? <CartRefreshNotice onRetry={retry} /> : null}
        <section className="rounded-editorial border border-border bg-surface p-8 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
            <Icon name="bag" size={22} />
          </span>
          <h2 className="mt-4 text-xl">سبد خرید شما هنوز خالی است</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            از میان انتخاب‌های آتلیه، قطعه‌ای برای روزهای پیش رو پیدا کنید.
          </p>
          <Button className="mt-5" asChild>
            <a href="/products/new">مشاهده تازه‌ها</a>
          </Button>
        </section>
      </main>
    );

  return (
    <main className="shell inner-page cart-page">
      <div className="breadcrumb">
        <a href="/" className="hover:text-primary">
          خانه
        </a>
        <span aria-hidden="true">/</span>
        <span>سبد خرید</span>
      </div>
      {isError ? <CartRefreshNotice onRetry={retry} /> : null}
      <header className="space-y-2">
        <span className="text-xs text-primary">NOVA / CART</span>
        <h1>سبد خرید</h1>
        <p>
          {formatPersianNumber(cart.itemCount)} کالا در سبد شماست.
        </p>
      </header>
      {mergeConflicts.length ? (
        <MergeConflictNotice
          conflicts={mergeConflicts}
          onResolve={resolveMergeConflict}
          isBusy={isBusy}
        />
      ) : null}
      <div className="cart-layout">
        <section className="cart-items" aria-labelledby="cart-items-title">
          <h2 className="sr-only" id="cart-items-title">
            کالاهای سبد خرید
          </h2>
          {summaryRows.map((line) => (
            <CartLineView
              key={line.id}
              line={line}
              busy={busyVariantId === line.variantId || isBusy || guestMergeActive}
              onUpdate={updateItem}
              onRemove={removeItem}
            />
          ))}
          <div className="cart-note">
            <Icon name="info" size={17} />
            <span>
              قیمت و موجودی در مرحله پرداخت دوباره بررسی می‌شود. موجودی کم یا تغییر قیمت بدون تأیید
              شما موفق تلقی نمی‌شود.
            </span>
          </div>
          {feedback ? (
            <p
              className={feedback.error ? 'text-sm text-destructive' : 'text-sm text-success'}
              role={feedback.error ? 'alert' : 'status'}
            >
              {feedback.message}
            </p>
          ) : null}
        </section>
        <aside
          className="summary-card"
          aria-labelledby="cart-summary-title"
        >
          <h2 id="cart-summary-title">
            خلاصه سفارش
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt>جمع کالاها</dt>
              <dd className="font-semibold">{formatToman(cart.subtotalToman)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>ارسال</dt>
              <dd className="text-muted-foreground">پس از انتخاب آدرس</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-3 font-semibold">
              <dt>مبلغ قابل پرداخت</dt>
              <dd className="text-primary">{formatToman(cart.subtotalToman)}</dd>
            </div>
          </dl>
          <div className="summary-card__actions mt-4 border-t border-border pt-4">
            <p className="text-xs leading-6 text-muted-foreground">
              کد تخفیف در مرحله پرداخت، همراه با آدرس و روش ارسال، با قیمت نهایی بررسی و محاسبه
              می‌شود.
            </p>
            <Button className="mt-4 w-full" asChild size="lg">
              <a href="/checkout/address">
                ادامه فرایند خرید <Icon name="arrow-left" size={17} />
              </a>
            </Button>
            <a className="mt-4 block text-center text-sm text-primary underline" href="/products">
              ادامه خرید
            </a>
          </div>
        </aside>
      </div>
      {recommendationsQuery.data?.items.length ? (
        <section className="cart-recommendations" aria-labelledby="cart-recommendations-title">
          <div className="section-heading">
            <h2 id="cart-recommendations-title">
              پیشنهادهای همراه
            </h2>
            <span className="text-xs text-muted-foreground">انتخاب‌های واقعی کاتالوگ</span>
          </div>
          <div className="product-grid">
            {recommendationsQuery.data.items.map(toStorefrontProduct).map((product) => (
              <RecommendationCard
                key={product.slug}
                product={product}
                onAdd={addRecommendation}
                busy={isBusy || guestMergeActive}
              />
            ))}
          </div>
        </section>
      ) : recommendationsQuery.isPending ? (
        <CartSkeleton />
      ) : recommendationsQuery.isError ? (
        <p>پیشنهادهای همراه موقتاً در دسترس نیستند.</p>
      ) : null}
    </main>
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


### 2. CartLineView

**Path:** `src/features/cart/components/cart-line-view.tsx`

```tsx
import { type CartLine } from '@nova/api-client';
import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

import { cartLineAvailability } from '@/features/cart/components/cart-line-availability';

import { formatToman } from '@/shared/utils/format-toman';

export function CartLineView({
  line,
  busy,
  onUpdate,
  onRemove,
}: {
  line: CartLine;
  busy: boolean;
  onUpdate: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
}) {
  const unavailable = cartLineAvailability(line) === 'unavailable';
  return (
    <article className="cart-line">
      <a
        className="cart-line__media"
        href={`/product/${encodeURIComponent(line.productSlug)}`}
        aria-label={`مشاهده ${line.productName}`}
      >
        {line.imageUrl ? (
          <img src={line.imageUrl}
            alt={line.imageAlt ?? line.productName}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-primary">
            <Icon name="shirt" size={28} />
          </span>
        )}
      </a>
      <div className="cart-line__body">
        <span className="cart-line__sku" dir="ltr">
          {line.sku}
        </span>
        <a
          className="cart-line__title"
          href={`/product/${encodeURIComponent(line.productSlug)}`}
        >
          {line.productName}
        </a>
        <p className="cart-line__variant">{line.title ?? 'تنوع انتخاب‌شده'}</p>
        <div className="cart-line__controls">
          <strong className="cart-line__price">{formatToman(line.unitPriceToman)}</strong>
          <div
            className="quantity-stepper"
            aria-label={`تعداد ${line.productName}`}
          >
            <Button
              className="quantity-stepper__button"
              type="button"
              aria-label="کاهش تعداد"
              disabled={busy || line.quantity <= 1}
              onClick={() => onUpdate(line.variantId, line.quantity - 1)}
            >
              −
            </Button>
            <span className="quantity-stepper__value" aria-live="polite">
              {formatPersianNumber(line.quantity)}
            </span>
            <Button
              className="quantity-stepper__button"
              type="button"
              aria-label="افزایش تعداد"
              disabled={busy || line.quantity >= 99}
              onClick={() => onUpdate(line.variantId, line.quantity + 1)}
            >
              +
            </Button>
          </div>
        </div>
        {unavailable ? (
          <p className="cart-line__warning">
            این تنوع دیگر موجود نیست و هنگام پرداخت قابل انتخاب نخواهد بود.
          </p>
        ) : null}
      </div>
      <Button
        className="icon-button cart-line__remove"
        type="button"
        disabled={busy}
        aria-label={`حذف ${line.productName}`}
        onClick={() => onRemove(line.variantId)}
      >
        <Icon name="close" size={17} />
      </Button>
    </article>
  );
}

```

---


### 3. CartRefreshNotice

**Path:** `src/features/cart/components/cart-refresh-notice.tsx`

```tsx
import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';

export function CartRefreshNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border border-warning bg-warning-soft p-4 text-sm"
      role="alert"
    >
      <span>به‌روزرسانی سبد خرید انجام نشد؛ اطلاعات فعلی ممکن است قدیمی باشد.</span>
      <Button type="button" size="sm" variant="outline" onClick={onRetry}>
        <Icon name="refresh" size={16} />
        تلاش دوباره
      </Button>
    </div>
  );
}

```

---


### 4. CartSkeleton

**Path:** `src/features/cart/components/cart-skeleton.tsx`

```tsx
export function CartSkeleton() {
  return (
    <section
      className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"
      role="status"
      aria-label="در حال بارگذاری سبد خرید"
    >
      <div className="space-y-3">
        {[1, 2].map((item) => (
          <div
            className="h-32 rounded-editorial bg-secondary motion-safe:animate-pulse"
            key={item}
          />
        ))}
      </div>
      <div className="h-72 rounded-editorial bg-secondary motion-safe:animate-pulse" />
    </section>
  );
}

```

---


### 5. MergeConflictNotice

**Path:** `src/features/cart/components/merge-conflict-notice.tsx`

```tsx
import { type CartMergeConflict } from '@nova/api-client';
import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

import { conflictQuantity } from '@/features/cart/components/conflict-quantity';

export function MergeConflictNotice({
  conflicts,
  onResolve,
  isBusy,
}: {
  conflicts: CartMergeConflict[];
  onResolve: (variantId: string, quantity: number) => void;
  isBusy: boolean;
}) {
  const reasonCopy: Record<CartMergeConflict['reason'], string> = {
    VARIANT_UNAVAILABLE: 'این تنوع دیگر موجود نیست.',
    STOCK_LIMIT: 'تعداد قابل افزودن به موجودی فعلی محدود شد.',
    QUANTITY_LIMIT: 'تعداد این کالا به سقف مجاز رسید.',
  };
  return (
    <section
      className="border border-warning bg-warning-soft p-4"
      role="alert"
      aria-labelledby="cart-merge-conflict-title"
    >
      <div className="flex items-start gap-3">
        <Icon name="warning" size={19} />
        <div>
          <h2 className="font-semibold" id="cart-merge-conflict-title">
            بخشی از سبد مهمان نیازمند بررسی است
          </h2>
          <p className="mt-1 text-sm leading-7">
            ورود انجام شده، اما این موارد بدون تأیید شما ادغام نشدند.
          </p>
        </div>
      </div>
      <ul className="mt-3 space-y-3">
        {conflicts.map((conflict) => {
          const nextQuantity = conflictQuantity(conflict);
          return (
            <li
              className="flex flex-wrap items-center justify-between gap-3 border-t border-warning/40 pt-3 text-sm"
              key={conflict.variantId}
            >
              <span>
                <span className="font-mono text-xs" dir="ltr">
                  {conflict.variantId}
                </span>
                <span className="ms-2">{reasonCopy[conflict.reason]}</span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => onResolve(conflict.variantId, nextQuantity ?? 0)}
              >
                {nextQuantity === null
                  ? 'حذف کالا از سبد مهمان'
                  : `نگه‌داشتن ${formatPersianNumber(nextQuantity)} عدد`}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

```

---


### 6. MessageCard

**Path:** `src/features/cart/components/message-card.tsx`

```tsx
import { type ReactNode } from 'react';

import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';

export function MessageCard({
  title,
  description,
  action,
  onAction,
  children,
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  children?: ReactNode;
}) {
  return (
    <section
      className="mx-auto w-full max-w-xl rounded-editorial border border-border bg-surface p-7 text-center shadow-card"
      role="alert"
    >
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning">
        <Icon name="warning" size={22} />
      </span>
      <h1 className="mt-4 text-xl">{title}</h1>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
      {children}
      {action && onAction ? (
        <Button className="mt-5" type="button" variant="outline" onClick={onAction}>
          <Icon name="refresh" size={16} />
          {action}
        </Button>
      ) : null}
    </section>
  );
}

```

---


### 7. RecommendationCard

**Path:** `src/features/cart/components/recommendation-card.tsx`

```tsx
import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';
import { type StorefrontProduct } from '@/features/catalog/api/catalog-api';

import { formatToman } from '@/shared/utils/format-toman';

export function RecommendationCard({
  product,
  onAdd,
  busy,
}: {
  product: StorefrontProduct;
  onAdd: (product: StorefrontProduct) => void;
  busy: boolean;
}) {
  const variant = product.variants?.find((item) => item.available);
  const disabled = !variant || product.available === false || busy;
  return (
    <article className="recommendation-card">
      <a
        className="recommendation-card__media"
        href={`/product/${encodeURIComponent(product.slug)}`}
        aria-label={`مشاهده ${product.name}`}
      >
        {product.image ? (
          <img src={product.image}
            alt={product.alt}
            loading="lazy"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground">
            <Icon name="shirt" size={25} />
          </span>
        )}
      </a>
      <div className="recommendation-card__body">
        <a
          className="recommendation-card__title"
          href={`/product/${encodeURIComponent(product.slug)}`}
        >
          {product.name}
        </a>
        <div className="recommendation-card__footer">
          <span className="recommendation-card__price">{formatToman(product.price)}</span>
          <Button
            className="recommendation-card__add"
            type="button"
            disabled={disabled}
            aria-label={
              disabled ? `${product.name} قابل افزودن نیست` : `افزودن ${product.name} به سبد`
            }
            onClick={() => onAdd(product)}
          >
            <Icon name="plus" size={16} />
          </Button>
        </div>
      </div>
    </article>
  );
}

```

---


### 8. Icon

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

- Page: `src/features/cart/components/CartView.tsx`
- Custom component files: 8
- Total files included: 9
