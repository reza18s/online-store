export function navigate(href: string): void {
  if (typeof window !== 'undefined') window.location.hash = href.slice(1);
}
