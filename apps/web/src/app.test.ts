import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import {
  AdminPage,
  AdminLegacyPage,
  AdminRouteUnavailablePage,
  RouteView,
  shouldShowAdminDashboardPreview,
  validateStaffLoginInput,
} from './app';

test('validates staff login fields with localized, field-specific errors', () => {
  assert.deepEqual(validateStaffLoginInput('', '', ''), {
    field: 'email',
    message: 'ایمیل سازمانی را وارد کنید.',
  });
  assert.deepEqual(validateStaffLoginInput('admin@', 'secret', '123456'), {
    field: 'email',
    message: 'لطفاً یک ایمیل معتبر وارد کنید.',
  });
  assert.deepEqual(validateStaffLoginInput('admin@example.com', '', '123456'), {
    field: 'password',
    message: 'رمز عبور را وارد کنید.',
  });
  assert.deepEqual(validateStaffLoginInput('admin@example.com', 'secret', ''), {
    field: 'factor',
    message: 'کد تأیید دومرحله‌ای یا کد بازیابی را وارد کنید.',
  });
  assert.equal(validateStaffLoginInput('admin@example.com', 'secret', '123456'), null);
});

test('renders the session-expired staff login state from the safe route marker', () => {
  const queryClient = new QueryClient();
  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AdminPage, { page: 'login', queryString: 'expired=1' }),
    ),
  );

  assert.match(markup, /نشست مدیریت منقضی شده است/);
  assert.match(markup, /role="status"/);
  queryClient.clear();
});

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
  assert.match(markup, /NOVA \/ ADMIN · DEV PREVIEW/);
  assert.match(markup, /NV-DEMO-001/);
  assert.doesNotMatch(markup, /NV-1405-2481/);
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

test('keeps the static admin dashboard preview development-only', () => {
  assert.equal(
    shouldShowAdminDashboardPreview({ isDevelopment: true, hasStaffSession: false }),
    true,
  );
  assert.equal(
    shouldShowAdminDashboardPreview({ isDevelopment: true, hasStaffSession: true }),
    false,
  );
  assert.equal(
    shouldShowAdminDashboardPreview({ isDevelopment: false, hasStaffSession: false }),
    false,
  );

  const queryClient = new QueryClient();
  queryClient.setQueryData(queryKeys.staffAuth.current(), {
    id: 'staff-preview',
    email: 'staff@example.test',
    status: 'ACTIVE',
    roles: ['admin'],
  });
  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AdminPage, { page: 'admin' }),
    ),
  );

  assert.match(markup, /داشبورد هنوز آماده نیست/);
  assert.doesNotMatch(markup, /۲۹۸٬۵۰۰٬۰۰۰/);
  queryClient.clear();
});

test('passes encoded admin customer lookup queries into the customer filter', () => {
  const queryClient = new QueryClient();
  const lookup = 'person+support@example.test';
  queryClient.setQueryData(queryKeys.staffAuth.current(), {
    id: 'staff-support',
    email: 'support@example.test',
    status: 'ACTIVE',
    roles: ['support'],
  });
  queryClient.setQueryData(queryKeys.adminCustomers.list({ page: 1, limit: 12, q: lookup }), {
    items: [],
    total: 0,
    page: 1,
    limit: 12,
  });

  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AdminPage, {
        page: 'customers',
        queryString: 'q=person%2Bsupport%40example.test',
      }),
    ),
  );

  assert.match(markup, /for="customer-query">ایمیل، تلفن یا شناسه مشتری/);
  assert.match(markup, /id="customer-query"/);
  assert.match(markup, /value="person\+support@example\.test"/);
  queryClient.clear();
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
