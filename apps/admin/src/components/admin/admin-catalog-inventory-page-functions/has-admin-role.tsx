export function hasAdminRole(roles: readonly string[] | undefined, required: string[]): boolean {
  if (!roles) return false;
  const available = new Set(roles.map((role) => role.toLowerCase()));
  return required.some((role) => available.has(role));
}
