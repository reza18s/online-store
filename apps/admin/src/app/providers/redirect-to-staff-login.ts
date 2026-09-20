export function redirectToStaffLogin(): void {
  if (typeof window === 'undefined') return;
  const target = '/admin/login?expired=1';
  if (window.location.pathname !== target.split('?')[0]) {
    window.location.assign(target);
  }
}
