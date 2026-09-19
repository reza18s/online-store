import { apiClient, type CheckoutQuote, type CheckoutRequestInput } from '@nova/api-client';

import { checkoutQuotePath } from '../checkout-api-shared';

import { normalizeCheckoutInput } from './normalize-checkout-input';

export async function fetchCheckoutQuote(input: CheckoutRequestInput): Promise<CheckoutQuote> {
  const response = await apiClient.postEnvelope<CheckoutQuote>(
    checkoutQuotePath,
    normalizeCheckoutInput(input),
  );
  return response.data;
}
