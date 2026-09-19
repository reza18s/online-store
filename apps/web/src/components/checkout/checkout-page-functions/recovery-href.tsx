import { type PaymentRecoveryState } from '../../../lib/checkout/checkout-state';

export function recoveryHref(state: PaymentRecoveryState, orderNumber: string): string {
  const params = new URLSearchParams({ orderNumber, paymentState: state });
  return `#checkout/payment-recovery?${params.toString()}`;
}
