import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type CheckoutRequestInput } from '@nova/api-client';

import { submitCheckout } from './submit-checkout';

export function useSubmitCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      idempotencyKey,
    }: {
      input: CheckoutRequestInput;
      idempotencyKey: string;
    }) => submitCheckout(input, idempotencyKey),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.checkout.all }),
      ]).then(() => undefined),
  });
}
