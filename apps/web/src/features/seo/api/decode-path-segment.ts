import { isPublicSlug } from '@nova/api-client';

export function decodePathSegment(value: string): string | undefined {
  try {
    const decoded = decodeURIComponent(value);
    return isPublicSlug(decoded) ? decoded : undefined;
  } catch {
    return undefined;
  }
}
