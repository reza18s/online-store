export function decodeSlug(value: string): string | null {
  try {
    return decodeURIComponent(value.trim()).trim();
  } catch {
    return null;
  }
}
