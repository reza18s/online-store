import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AdminLegacyPage, AdminRouteUnavailablePage } from './app';

test('renders an accessible mobile logout control in the legacy admin shell', () => {
  const queryClient = new QueryClient();
  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AdminLegacyPage, { page: 'orders' }),
    ),
  );

  assert.match(markup, /aria-label="خروج"/);
  assert.match(markup, /icon-button border-0 md:hidden disabled:opacity-50/);
  queryClient.clear();
});

test('renders a non-operational state instead of static data for an unfinished admin route', () => {
  const queryClient = new QueryClient();
  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AdminRouteUnavailablePage, { page: 'orders' }),
    ),
  );

  assert.match(markup, /سفارش‌ها هنوز آماده نیست/);
  assert.match(markup, /برای جلوگیری از نمایش اطلاعات نمونه/);
  assert.match(markup, /href="#admin"/);
  assert.doesNotMatch(markup, /سفارش‌های امروز/);
  queryClient.clear();
});
