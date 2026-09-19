import type { CheckoutFailure } from '../checkout-state-shared';

export function checkoutRetryTarget(
  failure: CheckoutFailure | null,
  source: 'quote' | 'submit' | 'address' | null,
): 'quote' | 'submit' | null {
  if (!failure || failure.action !== 'retry') return null;
  if (source === 'submit') return 'submit';
  return source === 'address' ? null : 'quote';
}
