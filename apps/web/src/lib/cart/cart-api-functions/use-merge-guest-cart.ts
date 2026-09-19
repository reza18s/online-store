import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { mergeGuestCart } from './merge-guest-cart';

export function useMergeGuestCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mergeGuestCart,
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.current(), cart);
    },
  });
}
