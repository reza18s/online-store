export function routeTo(hash: string): void {
  if (typeof window !== 'undefined') window.location.hash = hash.replace(/^#/, '');
}
