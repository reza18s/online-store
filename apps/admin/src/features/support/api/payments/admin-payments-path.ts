import { type AdminPaymentListQuery } from '@nova/api-client';

import { queryString } from '@/features/support/api/payments/query-string';

export function adminPaymentsPath(query: AdminPaymentListQuery = {}): string {
  return `/v1/admin/payments${queryString(query)}`;
}
