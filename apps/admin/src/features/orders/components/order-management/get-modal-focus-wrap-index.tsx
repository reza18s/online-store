export function getModalFocusWrapIndex(
  activeIndex: number,
  focusableCount: number,
  reverse: boolean,
): number | null {
  if (focusableCount <= 0) return null;
  const outsideDialog = activeIndex < 0 || activeIndex >= focusableCount;
  if (reverse && (outsideDialog || activeIndex === 0)) return focusableCount - 1;
  if (!reverse && (outsideDialog || activeIndex === focusableCount - 1)) return 0;
  return null;
}
