import {
  apiClient,
  type ApiEnvelope,
  type CheckoutOrder,
  type CheckoutRequestInput,
} from '@nova/api-client';

import { checkoutSubmitPath } from '../checkout-api-shared';

import { normalizeCheckoutInput } from './normalize-checkout-input';

export async function submitCheckout(
  input: CheckoutRequestInput,
  idempotencyKey: string,
): Promise<CheckoutOrder> {
  const normalizedKey = idempotencyKey.trim();
  if (!normalizedKey) throw new Error('Checkout submissions require a stable idempotency key.');

  const response = await apiClient.request<ApiEnvelope<CheckoutOrder>>(checkoutSubmitPath, {
    method: 'POST',
    headers: { 'Idempotency-Key': normalizedKey },
    body: JSON.stringify(normalizeCheckoutInput(input)),
  });
  return response.data;
}
