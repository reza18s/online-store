export function routeParts(route: string): { path: string; queryString: string } {
  const queryStart = route.indexOf('?');
  return {
    path: queryStart >= 0 ? route.slice(0, queryStart) : route,
    queryString: queryStart >= 0 ? route.slice(queryStart + 1) : '',
  };
}
