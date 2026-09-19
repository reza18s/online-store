export function normalizedPath(path: string): string {
  const value = path.trim();
  if (value.length <= 1) return '/';
  return value.replace(/\/+$/, '') || '/';
}
