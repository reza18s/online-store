import { apiClient, type AdminCoupon, type AdminCouponCreateInput } from '@nova/api-client';

export async function createAdminCoupon(input: AdminCouponCreateInput): Promise<AdminCoupon> {
  const response = await apiClient.postEnvelope<AdminCoupon>('/v1/admin/coupons', input);
  return response.data;
}
