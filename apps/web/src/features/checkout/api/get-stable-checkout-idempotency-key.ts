import { type CheckoutRequestInput } from '@nova/api-client';

import type {
  CheckoutIdempotencyQuote,
  CheckoutIdempotencyStorage,
} from '@/features/checkout/api/checkout-state-shared';

import { checkoutFingerprint } from '@/features/checkout/api/checkout-fingerprint';

import { createAndStoreCheckoutIdempotencyKey } from '@/features/checkout/api/create-and-store-checkout-idempotency-key';

import { createRandomKey } from '@/features/checkout/api/create-random-key';

import { readIdempotencyEntries } from '@/features/checkout/api/read-idempotency-entries';

import { storageAvailable } from '@/features/checkout/api/storage-available';

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
