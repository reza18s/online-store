export function normalizeSeoPath(path: string): string {
  const normalized = path.trim().replace(/\/+$/, '');
  return normalized || '/';
}
