export function hasAdminDashboardRole(roles: readonly string[] | undefined): boolean {
  return roles?.some((role) => role.toLowerCase() === 'admin') ?? false;
}
