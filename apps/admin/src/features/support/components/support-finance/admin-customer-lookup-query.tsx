export function adminCustomerLookupQuery(queryString: string): string {
  return new URLSearchParams(queryString).get('q')?.trim() ?? '';
}
