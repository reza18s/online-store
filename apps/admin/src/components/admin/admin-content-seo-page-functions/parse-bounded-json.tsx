import {
  MAX_JSON_DEPTH,
  MAX_JSON_LENGTH,
} from '../../../pages/admin/admin-content-seo-page-shared';

import { containsHtmlLikeValue } from './contains-html-like-value';

import { jsonDepth } from './json-depth';

export function parseBoundedJson(
  value: string,
  label = 'JSON',
): { value?: unknown; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { value: null };
  if (trimmed.length > MAX_JSON_LENGTH) {
    return { error: `${label} باید حداکثر ${MAX_JSON_LENGTH.toLocaleString('fa-IR')} نویسه باشد.` };
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (jsonDepth(parsed) > MAX_JSON_DEPTH) {
      return { error: `${label} بیش از حد تو در تو است.` };
    }
    if (containsHtmlLikeValue(parsed)) {
      return { error: `${label} نباید شامل HTML یا محتوای نشانه‌گذاری‌شده باشد.` };
    }
    return { value: parsed };
  } catch {
    return { error: `${label} معتبر نیست؛ ساختار JSON را بررسی کنید.` };
  }
}
