import { isContentPageSlug } from '@nova/api-client';

import { decodeSlug } from '@/features/content/components/decode-slug';

export function normalizePublicContentSlug(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const decoded = decodeSlug(value);
  if (!decoded) return null;
  const normalized = decoded.toLowerCase();
  return isContentPageSlug(normalized) ? normalized : null;
}
