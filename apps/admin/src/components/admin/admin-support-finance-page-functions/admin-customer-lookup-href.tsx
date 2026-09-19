export function adminCustomerLookupHref(value: string): string {
  return `#admin/customers?q=${encodeURIComponent(value)}`;
}
