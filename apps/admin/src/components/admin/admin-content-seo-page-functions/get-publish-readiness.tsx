import type { ContentDraft } from '../../../pages/admin/admin-content-seo-page-shared';

import { validateContentDraft } from './validate-content-draft';

export function getPublishReadiness(draft: ContentDraft): { canPublish: boolean; reason?: string } {
  const result = validateContentDraft(draft, { requireUsableContent: true });
  return result.error ? { canPublish: false, reason: result.error } : { canPublish: true };
}
