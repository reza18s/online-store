import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { updateCartItem } from './update-cart-item';

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      updateCartItem(variantId, quantity),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.current(), cart);
    },
  });
}
