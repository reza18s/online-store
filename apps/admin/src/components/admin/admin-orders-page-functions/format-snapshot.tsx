export function formatSnapshot(snapshot: unknown): string {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return 'مشخصات ثبت‌شده';
  const entries = Object.entries(snapshot).filter(
    ([, value]) =>
      typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean',
  );
  if (!entries.length) return 'مشخصات ثبت‌شده';
  return entries
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
}
