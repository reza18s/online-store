import { type CustomerOrderDetail } from '@nova/api-client';
import { Button } from '@nova/ui';

import {
  buildCheckoutHref,
  paymentRecoveryCopy,
  type PaymentRecoveryState,
} from '../../../lib/checkout/checkout-state';
import { Icon } from '../../ui/icon';

import { ConfirmationBody } from './confirmation-body';

import { paymentStateForOrder } from './payment-state-for-order';

export function OrderRecoveryState({
  order,
  state,
  refetch,
}: {
  order: CustomerOrderDetail;
  state: PaymentRecoveryState;
  refetch: () => void;
}) {
  if (order.paymentStatus === 'PAID' || order.status === 'CONFIRMED')
    return <ConfirmationBody order={order} />;
  const authoritativeState = paymentStateForOrder(order) ?? state;
  const authoritativeCopy = paymentRecoveryCopy(authoritativeState);
  const authoritativeActionHref =
    authoritativeState === 'timeout'
      ? `#order/${encodeURIComponent(order.orderNumber)}`
      : buildCheckoutHref('payment', { addressId: '', shippingMethod: 'STANDARD' });
  return (
    <section className="confirmation-card" aria-labelledby="payment-recovery-title">
      <span className="confirmation-card__icon" aria-hidden="true">
        <Icon name={authoritativeState === 'pending' ? 'refresh' : 'warning'} size={28} />
      </span>
      <span className="section-heading__eyebrow">NOVA / PAYMENT RECOVERY</span>
      <h1 id="payment-recovery-title">{authoritativeCopy.title}</h1>
      <p>{authoritativeCopy.message}</p>
      <strong className="ltr-value" dir="ltr">
        {order.orderNumber}
      </strong>
      <div className="confirmation-card__actions">
        {authoritativeState === 'pending' ? (
          <Button type="button" size="lg" onClick={refetch}>
            {authoritativeCopy.actionLabel}
          </Button>
        ) : (
          <Button asChild size="lg">
            <a href={authoritativeActionHref}>{authoritativeCopy.actionLabel}</a>
          </Button>
        )}
        <Button asChild variant="outline" size="lg">
          <a href={`#order/${encodeURIComponent(order.orderNumber)}`}>مشاهده وضعیت سفارش</a>
        </Button>
      </div>
    </section>
  );
}
