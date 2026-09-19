import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { addCartItem } from './add-cart-item';

export function useAddCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCartItem,
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.current(), cart);
    },
  });
}
