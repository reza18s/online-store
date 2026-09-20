import { type CheckoutRequestInput } from '@nova/api-client';

import type {
  CheckoutIdempotencyQuote,
  CheckoutIdempotencyStorage,
} from '@/features/checkout/api/checkout-state-shared';

import { checkoutFingerprint } from '@/features/checkout/api/checkout-fingerprint';

import { createAndStoreCheckoutIdempotencyKey } from '@/features/checkout/api/create-and-store-checkout-idempotency-key';

import { storageAvailable } from '@/features/checkout/api/storage-available';

export function rotateCheckoutIdempotencyKey(
  input: CheckoutRequestInput,
  quote: CheckoutIdempotencyQuote,
  storage: CheckoutIdempotencyStorage | undefined = storageAvailable(),
): string {
  return createAndStoreCheckoutIdempotencyKey(checkoutFingerprint(input, quote), storage);
}
