export function isAdminRoute(href: string): boolean {
  const path = href.split(/[?#]/, 1)[0] ?? '';
  return path === '/admin' || path.startsWith('/admin/');
}

export function navigateToRoute(href: string): void {
  if (typeof window === 'undefined' || !isAdminRoute(href)) return;
  window.history.pushState(window.history.state, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
