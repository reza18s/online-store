import { isIndexablePublicRenderPath } from './is-indexable-public-render-path';

export function normalizeCanonicalPath(
  origin: string,
  value: string | null | undefined,
): string | null {
  if (value == null) return null;

  const candidate = value.trim();
  if (!candidate || candidate.startsWith('//') || candidate.includes('\\')) return null;

  let site: URL;
  let canonical: URL;
  try {
    site = new URL(origin);
    canonical = candidate.startsWith('/') ? new URL(candidate, site) : new URL(candidate);
  } catch {
    return null;
  }

  if (
    !['http:', 'https:'].includes(site.protocol) ||
    canonical.origin !== site.origin ||
    canonical.username ||
    canonical.password ||
    canonical.search ||
    canonical.hash
  ) {
    return null;
  }

  const path = canonical.pathname.replace(/\/+$/, '') || '/';
  return isIndexablePublicRenderPath(path) ? path : null;
}
