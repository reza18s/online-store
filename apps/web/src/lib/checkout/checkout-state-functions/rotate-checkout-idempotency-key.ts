import { type CheckoutRequestInput } from '@nova/api-client';

import type {
  CheckoutIdempotencyQuote,
  CheckoutIdempotencyStorage,
} from '../checkout-state-shared';

import { checkoutFingerprint } from './checkout-fingerprint';

import { createAndStoreCheckoutIdempotencyKey } from './create-and-store-checkout-idempotency-key';

import { storageAvailable } from './storage-available';

export function rotateCheckoutIdempotencyKey(
  input: CheckoutRequestInput,
  quote: CheckoutIdempotencyQuote,
  storage: CheckoutIdempotencyStorage | undefined = storageAvailable(),
): string {
  return createAndStoreCheckoutIdempotencyKey(checkoutFingerprint(input, quote), storage);
}
