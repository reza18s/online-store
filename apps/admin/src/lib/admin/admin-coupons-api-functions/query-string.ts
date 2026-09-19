import { type AdminCouponListQuery } from '@nova/api-client';

import { normalizeCouponQuery } from './normalize-coupon-query';

export function queryString(query: AdminCouponListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeCouponQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}
