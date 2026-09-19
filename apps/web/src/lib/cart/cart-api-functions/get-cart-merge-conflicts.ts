import { ApiClientError, type CartMergeConflict } from '@nova/api-client';

import { isCartMergeConflict } from './is-cart-merge-conflict';

import { isRecord } from './is-record';

export function getCartMergeConflicts(error: unknown): CartMergeConflict[] {
  if (!(error instanceof ApiClientError) || error.payload?.error.code !== 'CART_MERGE_CONFLICT') {
    return [];
  }
  const details = error.payload.error.details;
  if (!isRecord(details) || !Array.isArray(details.conflicts)) return [];
  return details.conflicts.filter(isCartMergeConflict);
}
