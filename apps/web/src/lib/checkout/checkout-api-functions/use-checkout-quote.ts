import { useQuery } from '@tanstack/react-query';
import { queryKeys, type CheckoutRequestInput } from '@nova/api-client';

import { fetchCheckoutQuote } from './fetch-checkout-quote';

import { normalizeCheckoutInput } from './normalize-checkout-input';

export function useCheckoutQuote(input: CheckoutRequestInput, enabled = true) {
  const normalized = normalizeCheckoutInput(input);
  return useQuery({
    queryKey: queryKeys.checkout.quote(normalized),
    queryFn: () => fetchCheckoutQuote(normalized),
    enabled: enabled && Boolean(normalized.addressId),
    staleTime: 10_000,
  });
}
