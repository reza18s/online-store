export function normalizeTrackingReference(value: string): string | null {
  const normalized = value.trim();
  return normalized === '' ? null : normalized;
}
