export function hashRouteFromLocation(location: { pathname: string; search: string }): string {
  const pathname = location.pathname.replace(/^\/+/, '');
  const routePath = pathname ? `#${pathname}` : '#home';
  return `${routePath}${location.search}`;
}
