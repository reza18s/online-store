export function canManageAdminContent(roles: readonly string[] | undefined): boolean {
  return Boolean(roles?.some((role) => role.toLowerCase() === 'admin'));
}
