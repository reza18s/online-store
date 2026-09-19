import { type AdminCouponListQuery } from '@nova/api-client';

import { queryString } from './query-string';

export function adminCouponsPath(query: AdminCouponListQuery = {}): string {
  return `/v1/admin/coupons${queryString(query)}`;
}
