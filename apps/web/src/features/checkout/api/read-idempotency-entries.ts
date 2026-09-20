import type { CheckoutIdempotencyStorage } from '@/features/checkout/api/checkout-state-shared';
import { idempotencyStorageKey } from '@/features/checkout/api/checkout-state-shared';

export function readIdempotencyEntries(
  storage: CheckoutIdempotencyStorage,
): Record<string, unknown> {
  const stored = JSON.parse(storage.getItem(idempotencyStorageKey) ?? '{}') as unknown;
  return stored && typeof stored === 'object' && !Array.isArray(stored)
    ? (stored as Record<string, unknown>)
    : {};
}
