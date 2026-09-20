import { useQuery } from '@tanstack/react-query';
import { queryKeys, type AdminCustomerListQuery } from '@nova/api-client';

import { fetchAdminCustomers } from '@/features/support/api/customers/fetch-admin-customers';

import { normalizeCustomerQuery } from '@/features/support/api/customers/normalize-customer-query';

export function useAdminCustomers(query: AdminCustomerListQuery = {}, enabled = true) {
  const normalized = normalizeCustomerQuery(query);
  return useQuery({
    queryKey: queryKeys.adminCustomers.list(normalized),
    queryFn: () => fetchAdminCustomers(normalized),
    enabled,
    staleTime: 15_000,
  });
}
