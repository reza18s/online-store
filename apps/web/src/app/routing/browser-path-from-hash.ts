export function browserPathFromHash(hash: string): string | undefined {
  if (!hash.startsWith('#')) return undefined;
  const route = hash.slice(1);
  if (!route || route === '/') return '/';
  return route.startsWith('/') ? route : `/${route}`;
}
