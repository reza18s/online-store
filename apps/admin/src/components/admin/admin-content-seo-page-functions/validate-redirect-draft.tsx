import {
  type AdminRedirect,
  type AdminRedirectCreateInput,
  type AdminRedirectUpdateInput,
} from '@nova/api-client';

import type { RedirectDraft } from '../../../pages/admin/admin-content-seo-page-shared';

import { isSafeSiteRelativePath } from './is-safe-site-relative-path';

import { normalizeSiteRelativePath } from './normalize-site-relative-path';

import { wouldCreateRedirectCycle } from './would-create-redirect-cycle';

export function validateRedirectDraft(
  draft: RedirectDraft,
  redirects: readonly Pick<AdminRedirect, 'id' | 'fromPath' | 'toPath'>[] = [],
  id?: string,
): { input?: AdminRedirectCreateInput; update?: AdminRedirectUpdateInput; error?: string } {
  const fromPath = normalizeSiteRelativePath(draft.fromPath);
  const toPath = normalizeSiteRelativePath(draft.toPath);
  if (!isSafeSiteRelativePath(fromPath) || !isSafeSiteRelativePath(toPath))
    return { error: 'مبدأ و مقصد باید مسیرهای داخلی و نسبی از ریشه سایت باشند.' };
  if (wouldCreateRedirectCycle(redirects, { id, fromPath, toPath }))
    return { error: 'این تغییر یک چرخه در زنجیره redirect ایجاد می‌کند.' };
  return {
    input: { fromPath, toPath, statusCode: draft.statusCode },
    update: { toPath, statusCode: draft.statusCode },
  };
}
