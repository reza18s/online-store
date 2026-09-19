export function optionalNumber(value: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}
