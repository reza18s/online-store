import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryKeys, type CustomerOrderDetail } from '@nova/api-client';

import { CheckoutPaymentRecoveryPage } from './checkout-page';

function renderRecoveryPage(order: CustomerOrderDetail, paymentState: string): string {
  const queryClient = new QueryClient();
  queryClient.setQueryData(queryKeys.orders.detail(order.orderNumber), order);
  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(CheckoutPaymentRecoveryPage, {
        queryString: `orderNumber=${encodeURIComponent(order.orderNumber)}&paymentState=${paymentState}`,
      }),
    ),
  );
  queryClient.clear();
  return markup;
}

function orderWithPayment(paymentStatus: string, orderStatus = 'PENDING'): CustomerOrderDetail {
  return {
    orderNumber: 'NV-1',
    status: orderStatus,
    paymentStatus,
    payment: { status: paymentStatus },
    totalToman: 1000,
  } as CustomerOrderDetail;
}

test('uses authoritative pending copy when the payment URL state is stale', () => {
  const markup = renderRecoveryPage(orderWithPayment('PENDING'), 'failed');

  assert.match(markup, /پرداخت هنوز تأیید نشده است/);
  assert.match(markup, /بررسی دوباره وضعیت/);
  assert.doesNotMatch(markup, /بازگشت به پرداخت/);
});

test('sends timed-out recovery to the authoritative order status', () => {
  const markup = renderRecoveryPage(orderWithPayment('EXPIRED'), 'timeout');

  assert.match(markup, /زمان پاسخ پرداخت تمام شد/);
  assert.match(markup, /href="#order\/NV-1"[^>]*>مشاهده وضعیت سفارش/);
  assert.doesNotMatch(markup, /href="#checkout\/payment"/);
});

test('shows confirmation when a stale recovery URL points to a paid order', () => {
  const markup = renderRecoveryPage(orderWithPayment('PAID', 'CONFIRMED'), 'failed');

  assert.match(markup, /سفارش شما با موفقیت تأیید شد/);
  assert.match(markup, /پیگیری سفارش/);
  assert.doesNotMatch(markup, /پرداخت ناموفق بود|بازگشت به پرداخت/);
});
