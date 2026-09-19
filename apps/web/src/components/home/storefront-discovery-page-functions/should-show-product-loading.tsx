export function shouldShowProductLoading(slug: string, isPending: boolean): boolean {
  return Boolean(slug) && isPending;
}
