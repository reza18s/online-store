export function isAdminContentSeoEditorInputDisabled(canEdit: boolean, busy: boolean): boolean {
  return !canEdit || busy;
}
