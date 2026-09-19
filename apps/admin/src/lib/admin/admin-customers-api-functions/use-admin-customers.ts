import { useQuery } from '@tanstack/react-query';
import { queryKeys, type AdminCustomerListQuery } from '@nova/api-client';

import { fetchAdminCustomers } from './fetch-admin-customers';

import { normalizeCustomerQuery } from './normalize-customer-query';

export function useAdminCustomers(query: AdminCustomerListQuery = {}, enabled = true) {
  const normalized = normalizeCustomerQuery(query);
  return useQuery({
    queryKey: queryKeys.adminCustomers.list(normalized),
    queryFn: () => fetchAdminCustomers(normalized),
    enabled,
    staleTime: 15_000,
  });
}
