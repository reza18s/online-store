export function isAdminQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === 'admin';
}
