export function absoluteUrl(origin: string, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `${origin.replace(/\/$/, '')}${value.startsWith('/') ? value : `/${value}`}`;
}
