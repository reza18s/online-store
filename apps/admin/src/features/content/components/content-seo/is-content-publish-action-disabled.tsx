export function isContentPublishActionDisabled(
  canEdit: boolean,
  busy: boolean,
  dirty: boolean,
): boolean {
  return !canEdit || busy || dirty;
}
