import type { CheckoutIdempotencyStorage } from '../checkout-state-shared';
import { idempotencyStorageKey } from '../checkout-state-shared';

export function readIdempotencyEntries(
  storage: CheckoutIdempotencyStorage,
): Record<string, unknown> {
  const stored = JSON.parse(storage.getItem(idempotencyStorageKey) ?? '{}') as unknown;
  return stored && typeof stored === 'object' && !Array.isArray(stored)
    ? (stored as Record<string, unknown>)
    : {};
}
