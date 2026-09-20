import type { CheckoutIdempotencyStorage } from '@/features/checkout/api/checkout-state-shared';
import { idempotencyStorageKey } from '@/features/checkout/api/checkout-state-shared';

import { readIdempotencyEntries } from '@/features/checkout/api/read-idempotency-entries';

export function writeIdempotencyKey(
  fingerprint: string,
  key: string,
  storage: CheckoutIdempotencyStorage,
): void {
  storage.setItem(
    idempotencyStorageKey,
    JSON.stringify({ ...readIdempotencyEntries(storage), [fingerprint]: key }),
  );
}
