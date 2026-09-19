import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { test } from 'node:test';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CartView } from '@nova/api-client';

import {
  cartActionErrorMessage,
  cartLineAvailability,
  cartLineTotal,
  conflictQuantity,
  StorefrontCartPage,
} from './storefront-cart-page';

const cart: CartView = {
  id: 'cart-1',
  kind: 'GUEST',
  itemCount: 2,
  subtotalToman: 240_000,
  currency: 'TOMAN',
  items: [
    {
      id: 'line-1',
      variantId: 'variant-1',
      quantity: 2,
      available: true,
      productId: 'product-1',
      productSlug: 'linen-shirt',
      productName: 'پیراهن لینن',
      sku: 'NOVA-LINEN-1',
      title: 'اندازه M',
      unitPriceToman: 120_000,
      compareAtPriceToman: null,
      imageUrl: null,
      imageAlt: null,
    },
  ],
};

test('calculates line totals and exposes availability without inventory quantities', () => {
  assert.equal(cartLineTotal(cart.items[0]!), 240_000);
  assert.equal(cartLineAvailability(cart.items[0]!), 'available');
  assert.equal(cartLineAvailability({ available: false }), 'unavailable');
});

test('turns merge conflicts into safe quantity or removal actions', () => {
  assert.equal(
    conflictQuantity({
      variantId: 'v1',
      reason: 'VARIANT_UNAVAILABLE',
      guestQuantity: 1,
      customerQuantity: 0,
      mergedQuantity: 1,
      availableQuantity: null,
    }),
    null,
  );
  assert.equal(
    conflictQuantity({
      variantId: 'v2',
      reason: 'STOCK_LIMIT',
      guestQuantity: 3,
      customerQuantity: 1,
      mergedQuantity: 4,
      availableQuantity: 2,
    }),
    1,
  );
  assert.equal(
    conflictQuantity({
      variantId: 'v3',
      reason: 'QUANTITY_LIMIT',
      guestQuantity: 3,
      customerQuantity: 1,
      mergedQuantity: 4,
      availableQuantity: 0,
    }),
    null,
  );
  assert.equal(
    conflictQuantity({
      variantId: 'v4',
      reason: 'QUANTITY_LIMIT',
      guestQuantity: 3,
      customerQuantity: 98,
      mergedQuantity: 101,
      availableQuantity: 100,
    }),
    1,
  );
});

test('classifies offline and server conflicts without claiming a successful mutation', () => {
  const previousNavigator = globalThis.navigator;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: false } });
  assert.match(cartActionErrorMessage(new Error('network')), /اتصال شبکه/);
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: previousNavigator });
  assert.equal(cartActionErrorMessage(new Error('server')), 'server');
});

test('renders the controlled cart page with an accessible heading and isolated SKU', () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client },
      createElement(StorefrontCartPage, {
        cart,
        isLoading: false,
        isError: false,
        enableGuestMerge: false,
      }),
    ),
  );
  assert.match(markup, /<h1[^>]*>سبد خرید<\/h1>/);
  assert.match(markup, /dir="ltr"[^>]*>NOVA-LINEN-1/);
  assert.doesNotMatch(markup, /موجودی:|موجودی ۲/);
});

test('keeps cached cart contents visible when a refresh fails', () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client },
      createElement(StorefrontCartPage, {
        cart,
        isLoading: false,
        isError: true,
        onRetry: () => undefined,
        enableGuestMerge: false,
      }),
    ),
  );

  assert.match(markup, /<h1[^>]*>سبد خرید<\/h1>/);
  assert.match(markup, /به‌روزرسانی سبد خرید انجام نشد/);
  assert.match(markup, /تلاش دوباره/);
  assert.doesNotMatch(markup, /سبد خرید بارگذاری نشد/);
});

test('keeps cart actions enabled when guest-cart merge is disabled', () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client },
      createElement(StorefrontCartPage, {
        cart,
        isLoading: false,
        isError: false,
        customerId: 'customer-1',
        enableGuestMerge: false,
      }),
    ),
  );
  const decrementButton = markup.match(/<button[^>]*aria-label="کاهش تعداد"[^>]*>/)?.[0];
  assert.ok(decrementButton);
  assert.doesNotMatch(decrementButton, /\sdisabled(?:=|\s|>)/);
});
