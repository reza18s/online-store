import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchStaffUser } from './fetch-staff-user';

export function useStaffUser(enabled = true) {
  return useQuery({
    queryKey: queryKeys.staffAuth.current(),
    queryFn: fetchStaffUser,
    enabled,
    retry: false,
    staleTime: 30_000,
  });
}
