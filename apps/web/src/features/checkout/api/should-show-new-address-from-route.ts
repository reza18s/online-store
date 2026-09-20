export function shouldShowNewAddressFromRoute(queryString = ''): boolean {
  return (
    new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString).get(
      'newAddress',
    ) === '1'
  );
}
