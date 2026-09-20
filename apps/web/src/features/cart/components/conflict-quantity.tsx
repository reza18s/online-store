import { type CartMergeConflict } from '@nova/api-client';

export function conflictQuantity(conflict: CartMergeConflict): number | null {
  if (conflict.reason === 'VARIANT_UNAVAILABLE') return null;
  if (conflict.availableQuantity === null || conflict.availableQuantity <= 0) return null;
  const availableForGuest = Math.min(
    conflict.availableQuantity - conflict.customerQuantity,
    99 - conflict.customerQuantity,
  );
  if (availableForGuest <= 0) return null;
  return Math.min(99, conflict.guestQuantity, availableForGuest);
}
