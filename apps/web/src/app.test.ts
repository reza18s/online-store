import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { createSeoDocument } from './seo/metadata';
import {
  AdminPage,
  AdminLegacyPage,
  AdminRouteUnavailablePage,
  RouteView,
  resolveSeoDocumentForRoute,
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

test('keeps the static admin preview development-only and renders the live admin summary', () => {
  assert.equal(
    shouldShowAdminDashboardPreview({ page: 'admin', isDevelopment: true, hasStaffSession: false }),
    true,
  );
  assert.equal(
    shouldShowAdminDashboardPreview({ page: 'admin', isDevelopment: true, hasStaffSession: true }),
    false,
  );
  assert.equal(
    shouldShowAdminDashboardPreview({
      page: 'admin',
      isDevelopment: false,
      hasStaffSession: false,
    }),
    false,
  );
  assert.equal(
    shouldShowAdminDashboardPreview({
      page: 'orders',
      isDevelopment: true,
      hasStaffSession: false,
    }),
    false,
  );

  const queryClient = new QueryClient();
  queryClient.setQueryData(queryKeys.staffAuth.current(), {
    id: 'staff-preview',
    email: 'staff@example.test',
    status: 'ACTIVE',
    roles: ['admin'],
  });
  queryClient.setQueryData(queryKeys.adminDashboard.summary({ periodDays: 30 }), {
    publishedProductCount: 12,
    newCustomerCount: 4,
    newOrderCount: 8,
    paidGrossToman: 298500000,
    successfulRefundToman: 1250000,
    orderStatusCounts: {
      PENDING_PAYMENT: 1,
      CONFIRMED: 2,
      PREPARING: 1,
      SHIPPED: 1,
      DELIVERED: 2,
      CANCELLED: 1,
      RETURNED: 0,
    },
  });
  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AdminPage, { page: 'admin' }),
    ),
  );

  assert.match(markup, /NOVA \/ ADMIN DASHBOARD · LIVE SUMMARY/);
  assert.match(markup, /۲۹۸٬۵۰۰٬۰۰۰ تومان/);
  assert.match(markup, /staff@example\.test/);
  assert.doesNotMatch(markup, /داده نمایشی|حساب نمایشی|تاریخ نمایشی/);
  queryClient.clear();
});

test('denies a signed-in non-admin before the live dashboard query is used', () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(queryKeys.staffAuth.current(), {
    id: 'staff-support',
    email: 'support@example.test',
    status: 'ACTIVE',
    roles: ['support'],
  });

  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AdminPage, { page: 'admin' }),
    ),
  );

  assert.match(markup, /دسترسی کافی نیست/);
  assert.doesNotMatch(markup, /NOVA \/ ADMIN DASHBOARD · LIVE SUMMARY/);
  assert.equal(
    queryClient.getQueryData(queryKeys.adminDashboard.summary({ periodDays: 30 })),
    undefined,
  );
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

test('routes canonical and legacy new-product paths into the create editor', () => {
  for (const page of ['catalog/products/new', 'products/new']) {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.staffAuth.current(), {
      id: 'staff-admin',
      email: 'admin@example.test',
      status: 'ACTIVE',
      roles: ['admin'],
    });

    const markup = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(AdminPage, { page }),
      ),
    );

    assert.match(markup, /<h2[^>]*>محصول جدید<\/h2>/);
    assert.match(markup, /شناسه محصول/);
    assert.doesNotMatch(markup, /محصول پیدا نشد|این مسیر هنوز به داده‌های واقعی پنل متصل نشده است/);
    queryClient.clear();
  }
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
