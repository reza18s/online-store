import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClientError, queryKeys } from '@nova/api-client';

import { AdminPage } from './components/admin/admin-page';
import { createQueryClient } from './providers/query-client';
import { AdminLegacyPage } from './components/admin/admin-legacy-page';
import { AdminRouteUnavailablePage } from './components/admin/admin-route-unavailable-page';
import { shouldShowAdminDashboardPreview } from './utils/app/should-show-admin-dashboard-preview';
import { validateStaffLoginInput } from './utils/app/validate-staff-login-input';

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
  assert.deepEqual(
    validateStaffLoginInput('admin@example.com', 'correct horse battery staple', ''),
    {
      field: 'factor',
      message: 'کد تأیید دومرحله‌ای یا کد بازیابی را وارد کنید.',
    },
  );
  assert.equal(
    validateStaffLoginInput('admin@example.com', 'correct horse battery staple', '123456'),
    null,
  );
});

test('rejects staff credentials shorter than the API minima with localized field errors', () => {
  assert.deepEqual(validateStaffLoginInput('admin@example.com', 'short', '123456'), {
    field: 'password',
    message: 'رمز عبور باید حداقل ۱۲ کاراکتر باشد.',
  });
  assert.deepEqual(
    validateStaffLoginInput('admin@example.com', 'correct horse battery staple', '12345'),
    {
      field: 'factor',
      message: 'کد تأیید یا کد بازیابی باید حداقل ۶ کاراکتر باشد.',
    },
  );
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

test('clears protected cache and redirects on session failure, not role denial', async () => {
  let expiredCount = 0;
  const queryClient = createQueryClient({
    isDevelopment: false,
    onStaffSessionExpired: () => {
      expiredCount += 1;
    },
  });
  queryClient.setQueryData(['staff-auth', 'current'], { id: 'staff-data' });
  queryClient.setQueryData(['admin', 'orders'], { id: 'admin-data' });
  queryClient.setQueryData(['account', 'current'], { id: 'customer-data' });
  queryClient.setQueryData(['cart', 'current'], { id: 'cart-data' });

  await assert.rejects(
    queryClient.fetchQuery({
      queryKey: ['admin', 'orders'],
      queryFn: async () => {
        throw new ApiClientError(401);
      },
      staleTime: 0,
      retry: false,
    }),
  );

  assert.equal(expiredCount, 1);
  assert.equal(queryClient.getQueryData(['staff-auth', 'current']), undefined);
  assert.equal(queryClient.getQueryData(['admin', 'orders']), undefined);
  assert.deepEqual(queryClient.getQueryData(['account', 'current']), { id: 'customer-data' });
  assert.deepEqual(queryClient.getQueryData(['cart', 'current']), { id: 'cart-data' });

  queryClient.setQueryData(['staff-auth', 'current'], { id: 'staff-data' });
  queryClient.setQueryData(['admin', 'orders'], { id: 'admin-data' });
  const sessionExpiredMutation = queryClient.getMutationCache().build(queryClient, {
    mutationKey: ['admin', 'orders'],
    mutationFn: async () => {
      throw new ApiClientError(401);
    },
  });

  await assert.rejects(sessionExpiredMutation.execute(undefined));
  assert.equal(expiredCount, 2);
  assert.equal(queryClient.getQueryData(['staff-auth', 'current']), undefined);
  assert.equal(queryClient.getQueryData(['admin', 'orders']), undefined);
  assert.equal(queryClient.getMutationCache().findAll().length, 0);

  queryClient.setQueryData(['staff-auth', 'current'], { id: 'staff-data' });
  queryClient.setQueryData(['admin', 'orders'], { id: 'admin-data' });
  const roleDenied = queryClient.getMutationCache().build(queryClient, {
    mutationKey: ['admin', 'orders'],
    mutationFn: async () => {
      throw new ApiClientError(403);
    },
  });

  await assert.rejects(roleDenied.execute(undefined));
  assert.equal(expiredCount, 2);
  assert.deepEqual(queryClient.getQueryData(['staff-auth', 'current']), { id: 'staff-data' });
  assert.deepEqual(queryClient.getQueryData(['admin', 'orders']), { id: 'admin-data' });
  assert.equal(queryClient.getMutationCache().findAll().length, 1);
  queryClient.clear();
});
