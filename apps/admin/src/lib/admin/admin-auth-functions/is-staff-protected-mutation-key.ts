export function isStaffProtectedMutationKey(mutationKey: readonly unknown[] | undefined): boolean {
  return mutationKey?.[0] === 'admin';
}
