import type { PaymentRecoveryState } from '@/features/checkout/api/checkout-state-shared';
import { paymentStates } from '@/features/checkout/api/checkout-state-shared';

export function readPaymentState(value: string | null): PaymentRecoveryState | null {
  return value && paymentStates.has(value as PaymentRecoveryState)
    ? (value as PaymentRecoveryState)
    : null;
}
