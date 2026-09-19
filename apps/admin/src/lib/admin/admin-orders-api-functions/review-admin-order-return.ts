import { apiClient, type AdminOrderDetail, type AdminReturnReviewInput } from '@nova/api-client';

import { adminOrderReturnPath } from './admin-order-return-path';

export async function reviewAdminOrderReturn(
  orderNumber: string,
  input: AdminReturnReviewInput,
): Promise<AdminOrderDetail> {
  const response = await apiClient.patchEnvelope<AdminOrderDetail>(
    adminOrderReturnPath(orderNumber),
    input,
  );
  return response.data;
}
