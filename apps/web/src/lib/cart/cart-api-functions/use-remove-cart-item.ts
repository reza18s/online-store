import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { removeCartItem } from './remove-cart-item';

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.current(), cart);
    },
  });
}
