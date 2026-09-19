import { type CartMergeConflict } from '@nova/api-client';

import { isRecord } from './is-record';

export function isCartMergeConflict(value: unknown): value is CartMergeConflict {
  if (!isRecord(value)) return false;
  if (typeof value.variantId !== 'string' || value.variantId.length === 0) return false;
  if (
    value.reason !== 'VARIANT_UNAVAILABLE' &&
    value.reason !== 'STOCK_LIMIT' &&
    value.reason !== 'QUANTITY_LIMIT'
  ) {
    return false;
  }
  const guestQuantity = value.guestQuantity;
  const customerQuantity = value.customerQuantity;
  const mergedQuantity = value.mergedQuantity;
  const availableQuantity = value.availableQuantity;
  if (
    typeof guestQuantity !== 'number' ||
    !Number.isSafeInteger(guestQuantity) ||
    guestQuantity < 1 ||
    typeof customerQuantity !== 'number' ||
    !Number.isSafeInteger(customerQuantity) ||
    customerQuantity < 0 ||
    typeof mergedQuantity !== 'number' ||
    !Number.isSafeInteger(mergedQuantity) ||
    mergedQuantity < 1
  ) {
    return false;
  }
  return (
    availableQuantity === null ||
    (typeof availableQuantity === 'number' &&
      Number.isSafeInteger(availableQuantity) &&
      availableQuantity >= 0)
  );
}
