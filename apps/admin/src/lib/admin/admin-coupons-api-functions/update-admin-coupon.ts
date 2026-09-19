import { apiClient, type AdminCoupon, type AdminCouponUpdateInput } from '@nova/api-client';

import { encodeId } from './encode-id';

export async function updateAdminCoupon(
  couponId: string,
  input: AdminCouponUpdateInput,
): Promise<AdminCoupon> {
  const response = await apiClient.patchEnvelope<AdminCoupon>(
    `/v1/admin/coupons/${encodeId(couponId)}`,
    input,
  );
  return response.data;
}
