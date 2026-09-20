export function navigateToRoute(href: string): void {
  if (typeof window === 'undefined') return;
  if (!href.startsWith('/')) return;
  window.history.pushState(window.history.state, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
