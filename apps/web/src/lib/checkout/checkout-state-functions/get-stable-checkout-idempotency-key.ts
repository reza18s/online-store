import { type CheckoutRequestInput } from '@nova/api-client';

import type {
  CheckoutIdempotencyQuote,
  CheckoutIdempotencyStorage,
} from '../checkout-state-shared';

import { checkoutFingerprint } from './checkout-fingerprint';

import { createAndStoreCheckoutIdempotencyKey } from './create-and-store-checkout-idempotency-key';

import { createRandomKey } from './create-random-key';

import { readIdempotencyEntries } from './read-idempotency-entries';

import { storageAvailable } from './storage-available';

export function getStableCheckoutIdempotencyKey(
  input: CheckoutRequestInput,
  quote: CheckoutIdempotencyQuote,
  storage: CheckoutIdempotencyStorage | undefined = storageAvailable(),
): string {
  const fingerprint = checkoutFingerprint(input, quote);
  if (storage) {
    try {
      const entries = readIdempotencyEntries(storage);
      const existing = entries[fingerprint];
      if (typeof existing === 'string' && existing.trim()) return existing;
      return createAndStoreCheckoutIdempotencyKey(fingerprint, storage);
    } catch {
      return createRandomKey();
    }
  }
  return createRandomKey();
}
