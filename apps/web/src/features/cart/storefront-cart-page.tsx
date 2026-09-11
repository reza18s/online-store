import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  ApiClientError,
  type CartLine,
  type CartMergeConflict,
  type CartView,
} from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '../../shared/icon';
import {
  toStorefrontProduct,
  useCatalogProducts,
  type StorefrontProduct,
} from '../catalog/catalog-api';
import {
  getCartMergeConflicts,
  shouldMergeGuestCart,
  useAddCartItem,
  useCart,
  useMergeGuestCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from './cart-api';

export interface StorefrontCartPageProps {
  cart?: CartView;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onUpdateItem?: (variantId: string, quantity: number) => void;
  onRemoveItem?: (variantId: string) => void;
  customerId?: string;
  enableGuestMerge?: boolean;
  isWishlisted?: (slug: string) => boolean;
  onToggleWishlist?: (slug: string) => void;
}

export type CartLineAvailability = 'available' | 'unavailable';

export function cartLineTotal(line: Pick<CartLine, 'quantity' | 'unitPriceToman'>): number {
  return line.quantity * line.unitPriceToman;
}

export function cartLineAvailability(line: Pick<CartLine, 'available'>): CartLineAvailability {
  return line.available ? 'available' : 'unavailable';
}

export function conflictQuantity(conflict: CartMergeConflict): number | null {
  if (conflict.reason === 'VARIANT_UNAVAILABLE') return null;
  if (conflict.availableQuantity === null || conflict.availableQuantity <= 0) return null;
  const availableForGuest = Math.min(
    conflict.availableQuantity - conflict.customerQuantity,
    99 - conflict.customerQuantity,
  );
  if (availableForGuest <= 0) return null;
  return Math.min(99, conflict.guestQuantity, availableForGuest);
}

export function cartActionErrorMessage(error: unknown): string {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'اتصال شبکه برقرار نیست؛ پس از اتصال دوباره تلاش کنید.';
  }
  if (error instanceof ApiClientError) {
    if (error.status === 409)
      return 'قیمت یا موجودی یکی از کالاها تغییر کرده است؛ سبد را دوباره بررسی کنید.';
    if (error.payload?.error.message) return error.payload.error.message;
  }
  return error instanceof Error && error.message ? error.message : 'عملیات سبد خرید انجام نشد.';
}

function formatToman(amount: number): string {
  return `${new Intl.NumberFormat('fa-IR').format(amount)} تومان`;
}

function MessageCard({
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
      className="mx-auto w-full max-w-xl border border-border bg-surface p-7 text-center shadow-card"
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

function CartSkeleton() {
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

function MergeConflictNotice({
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
                  : `نگه‌داشتن ${new Intl.NumberFormat('fa-IR').format(nextQuantity)} عدد`}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CartLineView({
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
    <article className="grid grid-cols-[80px_minmax(0,1fr)_44px] gap-3 border-b border-border pb-4 md:grid-cols-[104px_minmax(0,1fr)_44px] md:gap-4">
      <a
        className="aspect-[4/5] overflow-hidden rounded-control bg-secondary"
        href={`#product/${encodeURIComponent(line.productSlug)}`}
        aria-label={`مشاهده ${line.productName}`}
      >
        {line.imageUrl ? (
          <img
            className="h-full w-full object-cover"
            src={line.imageUrl}
            alt={line.imageAlt ?? line.productName}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-primary">
            <Icon name="shirt" size={28} />
          </span>
        )}
      </a>
      <div className="min-w-0 space-y-1">
        <span className="block font-mono text-[10px] text-muted-foreground" dir="ltr">
          {line.sku}
        </span>
        <a
          className="block text-sm font-semibold leading-6 hover:text-primary"
          href={`#product/${encodeURIComponent(line.productSlug)}`}
        >
          {line.productName}
        </a>
        <p className="text-xs text-muted-foreground">{line.title ?? 'تنوع انتخاب‌شده'}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
          <strong className="text-sm text-primary">{formatToman(line.unitPriceToman)}</strong>
          <div
            className="inline-flex min-h-11 items-center border border-border bg-background"
            aria-label={`تعداد ${line.productName}`}
          >
            <button
              className="min-h-11 min-w-11 text-lg text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              aria-label="کاهش تعداد"
              disabled={busy || line.quantity <= 1}
              onClick={() => onUpdate(line.variantId, line.quantity - 1)}
            >
              −
            </button>
            <span className="min-w-8 text-center text-xs" aria-live="polite">
              {new Intl.NumberFormat('fa-IR').format(line.quantity)}
            </span>
            <button
              className="min-h-11 min-w-11 text-lg text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              aria-label="افزایش تعداد"
              disabled={busy || line.quantity >= 99}
              onClick={() => onUpdate(line.variantId, line.quantity + 1)}
            >
              +
            </button>
          </div>
        </div>
        {unavailable ? (
          <p className="text-xs text-warning">
            این تنوع دیگر موجود نیست و هنگام پرداخت قابل انتخاب نخواهد بود.
          </p>
        ) : null}
      </div>
      <button
        className="icon-button"
        type="button"
        disabled={busy}
        aria-label={`حذف ${line.productName}`}
        onClick={() => onRemove(line.variantId)}
      >
        <Icon name="close" size={17} />
      </button>
    </article>
  );
}

function RecommendationCard({
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
    <article className="min-w-0">
      <a
        className="block aspect-square overflow-hidden rounded-editorial bg-secondary"
        href={`#product/${encodeURIComponent(product.slug)}`}
        aria-label={`مشاهده ${product.name}`}
      >
        {product.image ? (
          <img
            className="h-full w-full object-cover"
            src={product.image}
            alt={product.alt}
            loading="lazy"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground">
            <Icon name="shirt" size={25} />
          </span>
        )}
      </a>
      <div className="pt-2">
        <a
          className="block text-sm font-semibold leading-6 hover:text-primary"
          href={`#product/${encodeURIComponent(product.slug)}`}
        >
          {product.name}
        </a>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs text-primary">{formatToman(product.price)}</span>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
            type="button"
            disabled={disabled}
            aria-label={
              disabled ? `${product.name} قابل افزودن نیست` : `افزودن ${product.name} به سبد`
            }
            onClick={() => onAdd(product)}
          >
            <Icon name="plus" size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function StorefrontCartPage(props: StorefrontCartPageProps) {
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
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean }>();
  const [mergeConflicts, setMergeConflicts] = useState<CartMergeConflict[]>([]);
  const [mergeResolutions, setMergeResolutions] = useState<Record<string, number>>({});
  const mergeAttempt = useRef<string | undefined>(undefined);
  const isBusy = Boolean(busyVariantId) || addMutation.isPending || mergeMutation.isPending;
  const mergeEnabled = props.enableGuestMerge ?? true;
  const guestMergeActive = Boolean(props.customerId && cart?.kind === 'GUEST');

  const handleMergeSuccess = () => {
    setMergeConflicts([]);
    setMergeResolutions({});
  };
  const handleMergeError = (error: unknown) => {
    const conflicts = getCartMergeConflicts(error);
    if (conflicts.length) setMergeConflicts(conflicts);
    else setFeedback({ message: cartActionErrorMessage(error), error: true });
  };
  const resolveMergeConflict = (variantId: string, quantity: number) => {
    setFeedback(undefined);
    const nextResolutions = { ...mergeResolutions, [variantId]: quantity };
    setMergeResolutions(nextResolutions);
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
  if (isError || !cart)
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
        <header className="space-y-2">
          <span className="text-xs text-primary">NOVA / CART</span>
          <h1 className="text-2xl md:text-3xl">سبد خرید</h1>
        </header>
        <section className="border border-border bg-surface p-8 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
            <Icon name="bag" size={22} />
          </span>
          <h2 className="mt-4 text-xl">سبد خرید شما هنوز خالی است</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            از میان انتخاب‌های آتلیه، قطعه‌ای برای روزهای پیش رو پیدا کنید.
          </p>
          <Button className="mt-5" asChild>
            <a href="#products/new">مشاهده تازه‌ها</a>
          </Button>
        </section>
      </main>
    );

  return (
    <main className="shell mx-auto w-[calc(100%-2rem)] max-w-[1280px] space-y-7 bg-background py-6 md:space-y-10 md:py-10">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <a href="#home" className="hover:text-primary">
          خانه
        </a>
        <span aria-hidden="true">/</span>
        <span>سبد خرید</span>
      </div>
      <header className="space-y-2">
        <span className="text-xs text-primary">NOVA / CART</span>
        <h1 className="text-2xl md:text-3xl">سبد خرید</h1>
        <p className="text-sm text-muted-foreground">
          {new Intl.NumberFormat('fa-IR').format(cart.itemCount)} کالا در سبد شماست.
        </p>
      </header>
      {mergeConflicts.length ? (
        <MergeConflictNotice
          conflicts={mergeConflicts}
          onResolve={resolveMergeConflict}
          isBusy={isBusy}
        />
      ) : null}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section className="space-y-4" aria-labelledby="cart-items-title">
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
          <div className="flex items-start gap-2 border border-border bg-surface p-4 text-sm leading-7 text-muted-foreground">
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
          className="h-max border border-border bg-surface p-5 shadow-card lg:sticky lg:top-24"
          aria-labelledby="cart-summary-title"
        >
          <h2 className="text-lg" id="cart-summary-title">
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
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs leading-6 text-muted-foreground">
              کد تخفیف در مرحله پرداخت، همراه با آدرس و روش ارسال، با قیمت نهایی بررسی و محاسبه
              می‌شود.
            </p>
            <Button className="mt-4 w-full" asChild size="lg">
              <a href="#checkout/address">
                ادامه فرایند خرید <Icon name="arrow-left" size={17} />
              </a>
            </Button>
            <a className="mt-4 block text-center text-sm text-primary underline" href="#products">
              ادامه خرید
            </a>
          </div>
        </aside>
      </div>
      {recommendationsQuery.data?.items.length ? (
        <section className="space-y-5" aria-labelledby="cart-recommendations-title">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl" id="cart-recommendations-title">
              پیشنهادهای همراه
            </h2>
            <span className="text-xs text-muted-foreground">انتخاب‌های واقعی کاتالوگ</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
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
        <p className="text-sm text-muted-foreground">پیشنهادهای همراه موقتاً در دسترس نیستند.</p>
      ) : null}
    </main>
  );
}
