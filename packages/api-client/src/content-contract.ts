export const CONTENT_PAGE_SLUG_MAX_LENGTH = 120;
export const CONTENT_PAGE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isContentPageSlug(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= CONTENT_PAGE_SLUG_MAX_LENGTH &&
    CONTENT_PAGE_SLUG_PATTERN.test(value)
  );
}
