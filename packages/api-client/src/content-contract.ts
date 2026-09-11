export const PUBLIC_SLUG_MAX_LENGTH = 120;
export const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isPublicSlug(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= PUBLIC_SLUG_MAX_LENGTH &&
    PUBLIC_SLUG_PATTERN.test(value)
  );
}

export const CONTENT_PAGE_SLUG_MAX_LENGTH = PUBLIC_SLUG_MAX_LENGTH;
export const CONTENT_PAGE_SLUG_PATTERN = PUBLIC_SLUG_PATTERN;

export function isContentPageSlug(value: unknown): value is string {
  return isPublicSlug(value);
}
