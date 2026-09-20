import { useMutation, useQueryClient } from '@tanstack/react-query';

import { clearStaffSessionCache } from '@/features/auth/api/admin-auth';

import { logoutStaff } from '@/features/auth/api/logout-staff';

export function useStaffLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutStaff,
    onSettled: () => clearStaffSessionCache(queryClient),
  });
}
