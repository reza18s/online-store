import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchCart } from '@/features/cart/api/fetch-cart';

export function useCart(enabled = true) {
  return useQuery({
    queryKey: queryKeys.cart.current(),
    queryFn: fetchCart,
    enabled,
    staleTime: 15_000,
  });
}
