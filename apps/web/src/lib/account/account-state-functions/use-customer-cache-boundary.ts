import { useEffect, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { clearCustomerProtectedCache } from './clear-customer-protected-cache';

export function useCustomerCacheBoundary(
  customerId: string | undefined,
  sessionExpired = false,
): void {
  const queryClient = useQueryClient();
  const previousCustomerId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (sessionExpired) {
      clearCustomerProtectedCache(queryClient, true);
      previousCustomerId.current = undefined;
      return;
    }
    if (customerId && previousCustomerId.current && previousCustomerId.current !== customerId) {
      clearCustomerProtectedCache(queryClient);
    }
    if (customerId) previousCustomerId.current = customerId;
  }, [customerId, queryClient, sessionExpired]);
}
