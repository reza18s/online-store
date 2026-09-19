import { useCustomerOrder } from '../../../lib/orders/orders-api';

import {
  parseCheckoutRouteParams,
  shouldShowCheckoutOrderLoading,
} from '../../../lib/checkout/checkout-state';

import { CheckoutShell } from './checkout-shell';

import { ConfirmationBody } from './confirmation-body';

import { OrderLookupState } from './order-lookup-state';

import { OrderRecoveryState } from './order-recovery-state';

import { paymentStateForOrder } from './payment-state-for-order';

export function CheckoutConfirmationPage({ queryString = '' }: { queryString?: string }) {
  const params = parseCheckoutRouteParams(queryString);
  const orderQuery = useCustomerOrder(params.orderNumber, Boolean(params.orderNumber));
  return (
    <CheckoutShell>
      <div className="breadcrumb">
        <a href="#account/orders">سفارش‌ها</a>
        <span>/</span>
        <span>تأیید سفارش</span>
      </div>
      {shouldShowCheckoutOrderLoading(params.orderNumber, orderQuery.isPending) ? (
        <section
          className="mx-auto max-w-2xl animate-pulse border border-border bg-surface p-8"
          role="status"
          aria-label="در حال دریافت سفارش ثبت‌شده"
        >
          <div className="mx-auto h-14 w-14 rounded-full bg-secondary" />
          <div className="mx-auto mt-5 h-7 max-w-sm rounded bg-secondary" />
          <div className="mx-auto mt-3 h-4 max-w-md rounded bg-secondary" />
        </section>
      ) : !params.orderNumber ? (
        <OrderLookupState error={new Error('شماره سفارش معتبر نیست.')} retry={() => undefined} />
      ) : orderQuery.isError || !orderQuery.data ? (
        <OrderLookupState error={orderQuery.error} retry={() => void orderQuery.refetch()} />
      ) : paymentStateForOrder(orderQuery.data) ? (
        <OrderRecoveryState
          order={orderQuery.data}
          state={paymentStateForOrder(orderQuery.data) ?? 'recovery'}
          refetch={() => void orderQuery.refetch()}
        />
      ) : (
        <ConfirmationBody order={orderQuery.data} />
      )}
    </CheckoutShell>
  );
}
