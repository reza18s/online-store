import type { CheckoutIdempotencyStorage } from '@/features/checkout/api/checkout-state-shared';

import { createRandomKey } from '@/features/checkout/api/create-random-key';

import { writeIdempotencyKey } from '@/features/checkout/api/write-idempotency-key';

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
