const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hidden &&
      !element.matches(':disabled') &&
      !element.closest('[inert], [aria-hidden="true"]') &&
      element.tabIndex >= 0,
  );
}

export function isFocusableElement(element: Element | null): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    element.isConnected &&
    !element.hidden &&
    !element.matches(':disabled') &&
    !element.closest('[inert], [aria-hidden="true"]') &&
    element.tabIndex >= 0
  );
}
