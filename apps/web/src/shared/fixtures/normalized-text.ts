export function normalizedText(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLocaleLowerCase('fa-IR') : '';
}
