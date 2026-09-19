import type { QueryClient } from '@tanstack/react-query';

import { clearStaffSessionCache } from './clear-staff-session-cache';

import { isStaffAuthFailure } from './is-staff-auth-failure';

export function handleStaffSessionFailure(
  queryClient: QueryClient,
  error: unknown,
  options: { hasStaffSession: boolean; isDevelopment: boolean },
): boolean {
  if (!isStaffAuthFailure(error)) return false;
  if (!options.hasStaffSession && options.isDevelopment) return false;

  clearStaffSessionCache(queryClient);
  return true;
}
