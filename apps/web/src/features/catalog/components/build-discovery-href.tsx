export function buildDiscoveryHref(
  baseHash: string,
  queryString: string,
  changes: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams(
    queryString.startsWith('?') ? queryString.slice(1) : queryString,
  );
  let resetPage = false;
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined || value === '') params.delete(key);
    else params.set(key, value);
    if (key !== 'page') resetPage = true;
  }
  if (resetPage) params.delete('page');
  const query = params.toString();
  return `${baseHash}${query ? `?${query}` : ''}`;
}
