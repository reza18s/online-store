import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchAdminPayment } from './fetch-admin-payment';

export function useAdminPayment(paymentAttemptId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminPayments.detail(paymentAttemptId),
    queryFn: () => fetchAdminPayment(paymentAttemptId),
    enabled: enabled && Boolean(paymentAttemptId),
    staleTime: 15_000,
  });
}
