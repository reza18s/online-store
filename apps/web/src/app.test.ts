import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { createSeoDocument } from './lib/seo/metadata';
import { RouteView, resolveSeoDocumentForRoute } from './app';

test('uses client SEO metadata after navigating from another public data route', () => {
  const seo = resolveSeoDocumentForRoute(
    '#product/linen-overshirt',
    {
      path: '/category/women',
      hashRoute: '#category/women',
      seo: createSeoDocument({
        origin: 'https://nova.example',
        title: 'NOVA | زنانه',
        description: 'دسته زنانه',
        canonicalPath: '/category/women',
      }),
    },
    '/category/women',
    'https://nova.example',
  );

  assert.equal(seo.title, 'NOVA | محصول');
  assert.equal(seo.canonicalUrl, 'https://nova.example/product/linen-overshirt');
  assert.equal(seo.robots, 'index, follow');
});

test('does not expose a fabricated order number from the payment preview state', () => {
  const markup = renderToStaticMarkup(
    createElement(RouteView, {
      route: '#checkout/payment-pending',
      cart: undefined,
      cartLoading: false,
      cartError: false,
      onRetryCart: () => undefined,
      isWishlisted: () => false,
      onToggleWishlist: () => undefined,
    }),
  );

  assert.doesNotMatch(markup, /NV-1405-2481/);
  assert.match(markup, /href="#account\/orders"/);
});

test('routes legacy editorial aliases through the published content renderer', () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(queryKeys.content.page('article'), {
    slug: 'article',
    title: 'عنوان منتشرشده از API',
    body: 'بدنه‌ای که از محتوای واقعی می‌آید.',
    blocks: [],
  });

  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(RouteView, {
        route: '#article',
        cart: undefined,
        cartLoading: false,
        cartError: false,
        onRetryCart: () => undefined,
        isWishlisted: () => false,
        onToggleWishlist: () => undefined,
      }),
    ),
  );

  assert.match(markup, /عنوان منتشرشده از API/);
  assert.match(markup, /محتوای منتشرشده/);
  assert.doesNotMatch(markup, /پیش‌نمایش از محتوای تحریریه/);
  assert.doesNotMatch(markup, /آماده اتصال به API محتواست/);
  queryClient.clear();
});
