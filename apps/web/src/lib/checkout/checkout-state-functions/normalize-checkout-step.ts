import type { CheckoutStep } from '../checkout-state-shared';

export function normalizeCheckoutStep(step: string): CheckoutStep {
  return step === 'shipping' || step === 'payment' ? step : 'address';
}
