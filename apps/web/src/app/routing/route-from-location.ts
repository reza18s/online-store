export function routeFromLocation(location: { pathname: string; search: string }): string {
  const pathname = location.pathname || '/';
  return `${pathname}${location.search}`;
}
