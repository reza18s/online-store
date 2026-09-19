import { MAX_HREF_LENGTH } from '../content-blocks-shared';

import { containsControlCharacter } from './contains-control-character';

export function safeSiteRelativeHref(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  if (
    !candidate ||
    candidate.length > MAX_HREF_LENGTH ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    containsControlCharacter(candidate)
  ) {
    return null;
  }

  const rawPath = candidate.split(/[?#]/, 1)[0] ?? '';
  const rawSegments = rawPath.split('/');
  if (
    rawSegments.some((segment) => segment === '.' || segment === '..') ||
    /%(?:2e|2f|5c)/i.test(rawPath)
  ) {
    return null;
  }

  try {
    const url = new URL(candidate, 'https://nova.invalid');
    if (url.origin !== 'https://nova.invalid' || url.username || url.password) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
