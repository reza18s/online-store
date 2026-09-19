import type { PaymentRecoveryState } from '../checkout-state-shared';
import { paymentStates } from '../checkout-state-shared';

export function readPaymentState(value: string | null): PaymentRecoveryState | null {
  return value && paymentStates.has(value as PaymentRecoveryState)
    ? (value as PaymentRecoveryState)
    : null;
}
