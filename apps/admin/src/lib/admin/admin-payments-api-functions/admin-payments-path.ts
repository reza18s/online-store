import { type AdminPaymentListQuery } from '@nova/api-client';

import { queryString } from './query-string';

export function adminPaymentsPath(query: AdminPaymentListQuery = {}): string {
  return `/v1/admin/payments${queryString(query)}`;
}
