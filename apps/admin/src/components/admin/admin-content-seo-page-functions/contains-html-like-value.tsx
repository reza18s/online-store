import { HTML_LIKE } from '../../../pages/admin/admin-content-seo-page-shared';

export function containsHtmlLikeValue(value: unknown): boolean {
  if (typeof value === 'string') return HTML_LIKE.test(value);
  if (Array.isArray(value)) return value.some(containsHtmlLikeValue);
  if (value && typeof value === 'object') {
    return Object.entries(value).some(
      ([key, child]) => HTML_LIKE.test(key) || containsHtmlLikeValue(child),
    );
  }
  return false;
}
