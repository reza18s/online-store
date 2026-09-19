import { apiClient, type AdminCouponListQuery, type AdminCouponPage } from '@nova/api-client';

import { adminCouponsPath } from './admin-coupons-path';

export async function fetchAdminCoupons(
  query: AdminCouponListQuery = {},
): Promise<AdminCouponPage> {
  const response = await apiClient.getEnvelope<AdminCouponPage>(adminCouponsPath(query));
  return response.data;
}
