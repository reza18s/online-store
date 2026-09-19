import type { CheckoutIdempotencyStorage } from '../checkout-state-shared';
import { idempotencyStorageKey } from '../checkout-state-shared';

import { readIdempotencyEntries } from './read-idempotency-entries';

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
