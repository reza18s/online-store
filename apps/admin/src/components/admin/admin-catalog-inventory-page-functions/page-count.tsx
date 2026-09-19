export function pageCount(total: number, limit: number): number {
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(limit) || limit <= 0) return 1;
  return Math.max(1, Math.ceil(total / limit));
}
