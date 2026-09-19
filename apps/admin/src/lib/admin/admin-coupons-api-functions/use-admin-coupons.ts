import { useQuery } from '@tanstack/react-query';
import { queryKeys, type AdminCouponListQuery } from '@nova/api-client';

import { fetchAdminCoupons } from './fetch-admin-coupons';

import { normalizeCouponQuery } from './normalize-coupon-query';

export function useAdminCoupons(query: AdminCouponListQuery = {}, enabled = true) {
  const normalized = normalizeCouponQuery(query);
  return useQuery({
    queryKey: queryKeys.adminCoupons.list(normalized),
    queryFn: () => fetchAdminCoupons(normalized),
    enabled,
    staleTime: 15_000,
  });
}
