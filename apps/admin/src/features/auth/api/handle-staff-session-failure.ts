import type { QueryClient } from '@tanstack/react-query';

import { clearStaffSessionCache } from '@/features/auth/api/clear-staff-session-cache';

import { isStaffAuthFailure } from '@/features/auth/api/is-staff-auth-failure';

export function handleStaffSessionFailure(
  queryClient: QueryClient,
  error: unknown,
): boolean {
  if (!isStaffAuthFailure(error)) return false;

  clearStaffSessionCache(queryClient);
  return true;
}
