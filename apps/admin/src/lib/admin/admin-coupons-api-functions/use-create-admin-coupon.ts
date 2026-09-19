import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { createAdminCoupon } from './create-admin-coupon';

export function useCreateAdminCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCoupons.all,
    mutationFn: createAdminCoupon,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminCoupons.all }),
  });
}
