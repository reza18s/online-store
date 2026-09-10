import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiClient,
  queryKeys,
  type ApiEnvelope,
  type CheckoutOrder,
  type CheckoutQuote,
  type CheckoutRequestInput,
} from '@nova/api-client';

export const checkoutQuotePath = '/v1/checkout/quote';
export const checkoutSubmitPath = '/v1/checkout';

export function normalizeCheckoutInput(input: CheckoutRequestInput): CheckoutRequestInput {
  const couponCode = input.couponCode?.trim();
  return couponCode
    ? { ...input, couponCode }
    : { addressId: input.addressId, shippingMethod: input.shippingMethod };
}

export async function fetchCheckoutQuote(input: CheckoutRequestInput): Promise<CheckoutQuote> {
  const response = await apiClient.postEnvelope<CheckoutQuote>(
    checkoutQuotePath,
    normalizeCheckoutInput(input),
  );
  return response.data;
}

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

export function useCheckoutQuote(input: CheckoutRequestInput, enabled = true) {
  const normalized = normalizeCheckoutInput(input);
  return useQuery({
    queryKey: queryKeys.checkout.quote(normalized),
    queryFn: () => fetchCheckoutQuote(normalized),
    enabled: enabled && Boolean(normalized.addressId),
    staleTime: 10_000,
  });
}

export function useSubmitCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: CheckoutRequestInput; idempotencyKey: string }) =>
      submitCheckout(input, idempotencyKey),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.checkout.all }),
      ]).then(() => undefined),
  });
}
