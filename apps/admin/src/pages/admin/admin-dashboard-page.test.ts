import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClientError, queryKeys } from '@nova/api-client';

import {
  AdminDashboardPage,
  adminDashboardErrorMessage,
  hasAdminDashboardRole,
} from './admin-dashboard-page';

const summary = {
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
};

function renderDashboard(queryClient: QueryClient, staffRoles: readonly string[] | undefined) {
  return renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AdminDashboardPage, { staffRoles }),
    ),
  );
}

test('renders the API-backed summary without preview-only content', () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(queryKeys.adminDashboard.summary({ periodDays: 30 }), summary);

  const markup = renderDashboard(queryClient, ['ADMIN']);

  assert.match(markup, /NOVA \/ ADMIN DASHBOARD · LIVE SUMMARY/);
  assert.match(markup, /محصولات منتشرشده/);
  assert.match(markup, /۲۹۸٬۵۰۰٬۰۰۰ تومان/);
  assert.match(markup, /در انتظار پرداخت/);
  assert.match(markup, /۷ روز گذشته/);
  assert.match(markup, /۳۰ روز گذشته/);
  assert.match(markup, /۹۰ روز گذشته/);
  assert.doesNotMatch(markup, /داده نمایشی|نمودار فروش|سفارش‌های اخیر/);
  queryClient.clear();
});

test('does not enable or render dashboard data for a non-admin role', () => {
  const queryClient = new QueryClient();

  const markup = renderDashboard(queryClient, ['support']);

  assert.match(markup, /دسترسی کافی نیست/);
  assert.doesNotMatch(markup, /NOVA \/ ADMIN DASHBOARD · LIVE SUMMARY/);
  assert.equal(
    queryClient.getQueryData(queryKeys.adminDashboard.summary({ periodDays: 30 })),
    undefined,
  );
  queryClient.clear();
});

test('keeps API error states localized and actionable', () => {
  assert.equal(
    adminDashboardErrorMessage(new ApiClientError(403)),
    'شما اجازه مشاهده خلاصه داشبورد را ندارید.',
  );
  assert.equal(
    adminDashboardErrorMessage(
      new ApiClientError(503, {
        error: {
          code: 'DASHBOARD_UNAVAILABLE',
          message: 'سرویس خلاصه در دسترس نیست.',
          statusCode: 503,
          requestId: 'test-request',
          timestamp: '2026-09-13T00:00:00.000Z',
        },
      }),
    ),
    'سرویس خلاصه در دسترس نیست.',
  );
  assert.equal(hasAdminDashboardRole(['support', 'ADMIN']), true);
  assert.equal(hasAdminDashboardRole(['support']), false);
  assert.equal(hasAdminDashboardRole(undefined), false);
});
