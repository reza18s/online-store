export function shouldShowAdminDashboardPreview({
  page,
  isDevelopment,
  hasStaffSession,
}: {
  page: string;
  isDevelopment: boolean;
  hasStaffSession: boolean;
}): boolean {
  return page === 'admin' && isDevelopment && !hasStaffSession;
}
