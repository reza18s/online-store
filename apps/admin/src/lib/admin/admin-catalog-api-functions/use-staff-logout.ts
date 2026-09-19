import { useMutation, useQueryClient } from '@tanstack/react-query';

import { clearStaffSessionCache } from '../admin-auth';

import { logoutStaff } from './logout-staff';

export function useStaffLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutStaff,
    onSettled: () => clearStaffSessionCache(queryClient),
  });
}
