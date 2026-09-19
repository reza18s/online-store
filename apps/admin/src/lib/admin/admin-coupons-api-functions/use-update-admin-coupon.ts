import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AdminCouponUpdateInput } from '@nova/api-client';

import { updateAdminCoupon } from './update-admin-coupon';

export function useUpdateAdminCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCoupons.all,
    mutationFn: ({ couponId, input }: { couponId: string; input: AdminCouponUpdateInput }) =>
      updateAdminCoupon(couponId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminCoupons.all }),
  });
}
