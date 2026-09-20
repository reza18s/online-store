import { type AdminCouponListQuery } from '@nova/api-client';

import { queryString } from '@/features/catalog/api/coupons/query-string';

export function adminCouponsPath(query: AdminCouponListQuery = {}): string {
  return `/v1/admin/coupons${queryString(query)}`;
}
