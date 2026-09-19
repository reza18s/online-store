import { SAFE_SITE_PATH } from '../../../pages/admin/admin-content-seo-page-shared';

import { normalizeSiteRelativePath } from './normalize-site-relative-path';

export function isSafeSiteRelativePath(value: string): boolean {
  const raw = value.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) return false;
  const normalized = normalizeSiteRelativePath(value);
  return normalized.length <= 500 && normalized !== '//' && SAFE_SITE_PATH.test(normalized);
}
