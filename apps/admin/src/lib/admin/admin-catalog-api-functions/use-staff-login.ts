import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';
import { clearStaffSessionCache } from '../admin-auth';

import { loginStaff } from './login-staff';

export function useStaffLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginStaff,
    onSuccess: (user) => {
      clearStaffSessionCache(queryClient);
      queryClient.setQueryData(queryKeys.staffAuth.current(), user);
    },
  });
}
