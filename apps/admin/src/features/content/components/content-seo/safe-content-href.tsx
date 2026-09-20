export function safeContentHref(slug: string): string {
  return `#content/${encodeURIComponent(slug.trim().toLowerCase())}`;
}
