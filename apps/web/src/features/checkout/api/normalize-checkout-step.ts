import type { CheckoutStep } from '@/features/checkout/api/checkout-state-shared';

export function normalizeCheckoutStep(step: string): CheckoutStep {
  return step === 'shipping' || step === 'payment' ? step : 'address';
}
