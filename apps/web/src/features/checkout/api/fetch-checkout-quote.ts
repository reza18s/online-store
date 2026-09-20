import { apiClient, type CheckoutQuote, type CheckoutRequestInput } from '@nova/api-client';

import { checkoutQuotePath } from '@/features/checkout/api/checkout-api-shared';

import { normalizeCheckoutInput } from '@/features/checkout/api/normalize-checkout-input';

export async function fetchCheckoutQuote(input: CheckoutRequestInput): Promise<CheckoutQuote> {
  const response = await apiClient.postEnvelope<CheckoutQuote>(
    checkoutQuotePath,
    normalizeCheckoutInput(input),
  );
  return response.data;
}
