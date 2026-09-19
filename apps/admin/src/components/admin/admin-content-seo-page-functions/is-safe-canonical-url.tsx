import { isSafeSiteRelativePath } from './is-safe-site-relative-path';

export function isSafeCanonicalUrl(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//')) return isSafeSiteRelativePath(value);
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}
