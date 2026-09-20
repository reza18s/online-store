import type { ContentDraft } from '@/features/content/pages/admin-content-seo-page-shared';

import { validateContentDraft } from '@/features/content/components/content-seo/validate-content-draft';

export function getPublishReadiness(draft: ContentDraft): { canPublish: boolean; reason?: string } {
  const result = validateContentDraft(draft, { requireUsableContent: true });
  return result.error ? { canPublish: false, reason: result.error } : { canPublish: true };
}
