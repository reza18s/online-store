import type { CheckoutIdempotencyStorage } from '../checkout-state-shared';

import { createRandomKey } from './create-random-key';

import { writeIdempotencyKey } from './write-idempotency-key';

export function createAndStoreCheckoutIdempotencyKey(
  fingerprint: string,
  storage: CheckoutIdempotencyStorage | undefined,
): string {
  const key = createRandomKey();
  if (storage) {
    try {
      writeIdempotencyKey(fingerprint, key, storage);
    } catch {
      // A storage failure must not prevent checkout; use the in-memory key.
    }
  }
  return key;
}
