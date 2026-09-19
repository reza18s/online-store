import {
  type AdminSeoMetadataCreateInput,
  type AdminSeoMetadataUpdateInput,
} from '@nova/api-client';

import type { SeoDraft } from '../../../pages/admin/admin-content-seo-page-shared';

import { isSafeCanonicalUrl } from './is-safe-canonical-url';

import { isSafeSiteRelativePath } from './is-safe-site-relative-path';

import { normalizeSiteRelativePath } from './normalize-site-relative-path';

import { parseBoundedJson } from './parse-bounded-json';

export function validateSeoDraft(draft: SeoDraft): {
  input?: AdminSeoMetadataCreateInput;
  update?: AdminSeoMetadataUpdateInput;
  error?: string;
} {
  const path = normalizeSiteRelativePath(draft.path);
  if (!isSafeSiteRelativePath(path))
    return { error: 'مسیر باید یک مسیر داخلی معتبر و نسبی از ریشه سایت باشد.' };
  const title = draft.title.trim();
  const description = draft.description.trim();
  if (!title) return { error: 'عنوان SEO را وارد کنید.' };
  if (!description) return { error: 'توضیح SEO را وارد کنید.' };
  if (title.length > 200 || description.length > 500)
    return { error: 'طول عنوان یا توضیح SEO بیشتر از حد مجاز است.' };
  const canonicalUrl = draft.canonicalUrl.trim();
  if (canonicalUrl && !isSafeCanonicalUrl(canonicalUrl))
    return { error: 'canonical باید مسیر داخلی یا URL امن HTTPS باشد.' };
  const structured = parseBoundedJson(draft.structuredDataJson, 'داده ساختاریافته');
  if (structured.error) return { error: structured.error };
  const input = {
    path,
    title,
    description,
    canonicalUrl: canonicalUrl || null,
    noIndex: draft.noIndex,
    structuredData: structured.value ?? null,
  };
  return {
    input,
    update: {
      title,
      description,
      canonicalUrl: canonicalUrl || null,
      noIndex: draft.noIndex,
      structuredData: structured.value ?? null,
    },
  };
}
