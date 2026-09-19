import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@nova/ui';
import { Icon } from '../../ui/icon';
import {
  toStorefrontProduct,
  useCatalogProducts,
  type StorefrontProduct,
} from '../../../lib/catalog/catalog-api';
import {
  getCartMergeConflicts,
  shouldMergeGuestCart,
  useAddCartItem,
  useCart,
  useMergeGuestCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from '../../../lib/cart/cart-api';
import { useCartUiStore } from '../../../lib/cart/cart-ui-store';

import type { StorefrontCartPageProps } from '../../../pages/cart/storefront-cart-page-shared';

import { CartLineView } from './cart-line-view';

import { CartRefreshNotice } from './cart-refresh-notice';

import { CartSkeleton } from './cart-skeleton';

import { MergeConflictNotice } from './merge-conflict-notice';

import { MessageCard } from './message-card';

import { RecommendationCard } from './recommendation-card';

import { cartActionErrorMessage } from './cart-action-error-message';

import { cartLineTotal } from './cart-line-total';

import { formatToman } from './format-toman';

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
        <header className="space-y-2">
          <span className="text-xs text-primary">NOVA / CART</span>
          <h1 className="text-2xl md:text-3xl">سبد خرید</h1>
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
      {isError ? <CartRefreshNotice onRetry={retry} /> : null}
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
          <div className="flex items-start gap-2 rounded-control border border-border bg-surface p-4 text-sm leading-7 text-muted-foreground">
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
          className="h-max rounded-editorial border border-border bg-surface p-5 shadow-card lg:sticky lg:top-24"
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
