import type { QueryClient } from '@tanstack/react-query';

import { ApiClientError } from '@nova/api-client';

export function isAdminQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === 'admin';
}

export function isStaffCurrentQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey.length === 2 && queryKey[0] === 'staff-auth' && queryKey[1] === 'current';
}

export function isStaffProtectedQueryKey(queryKey: readonly unknown[]): boolean {
  return isAdminQueryKey(queryKey) || isStaffCurrentQueryKey(queryKey);
}

export function isStaffAuthFailure(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 401;
}

export function isStaffAuthorizationFailure(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 403;
}

export function isStaffProtectedMutationKey(mutationKey: readonly unknown[] | undefined): boolean {
  return mutationKey?.[0] === 'admin';
}

export function clearStaffSessionCache(queryClient: QueryClient): void {
  queryClient.removeQueries({
    predicate: ({ queryKey }) => isAdminQueryKey(queryKey) || isStaffCurrentQueryKey(queryKey),
  });

  const mutationCache = queryClient.getMutationCache();
  for (const mutation of mutationCache.findAll({
    predicate: ({ options }) => isStaffProtectedMutationKey(options.mutationKey),
  })) {
    mutationCache.remove(mutation);
  }
}

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
