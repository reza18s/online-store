export function isStaffCurrentQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey.length === 2 && queryKey[0] === 'staff-auth' && queryKey[1] === 'current';
}
