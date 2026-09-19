import { useQuery } from '@tanstack/react-query';
import { queryKeys, type AdminPaymentListQuery } from '@nova/api-client';

import { fetchAdminPayments } from './fetch-admin-payments';

import { normalizePaymentQuery } from './normalize-payment-query';

export function useAdminPayments(query: AdminPaymentListQuery = {}, enabled = true) {
  const normalized = normalizePaymentQuery(query);
  return useQuery({
    queryKey: queryKeys.adminPayments.list(normalized),
    queryFn: () => fetchAdminPayments(normalized),
    enabled,
    staleTime: 15_000,
  });
}
