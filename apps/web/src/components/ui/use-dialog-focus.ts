import { useEffect, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react';

import { getFocusableElements, isFocusableElement } from './focusable-elements';

export function useDialogFocus(
  open: boolean,
  dialogRef: RefObject<HTMLElement | null>,
  initialFocusRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;

    const invokingElement = document.activeElement;
    const focusable = dialogRef.current ? getFocusableElements(dialogRef.current) : [];
    const requestedInitialFocus = initialFocusRef?.current;
    const initialFocus =
      requestedInitialFocus && focusable.includes(requestedInitialFocus)
        ? requestedInitialFocus
        : focusable[0];
    initialFocus?.focus();

    return () => {
      if (isFocusableElement(invokingElement)) invokingElement.focus();
    };
  }, [dialogRef, initialFocusRef, open]);

  return (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = getFocusableElements(dialog);
    if (!focusable.length) return;

    const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
    const nextIndex = event.shiftKey
      ? activeIndex <= 0
        ? focusable.length - 1
        : activeIndex - 1
      : activeIndex === -1 || activeIndex === focusable.length - 1
        ? 0
        : activeIndex + 1;

    event.preventDefault();
    focusable[nextIndex]?.focus();
  };
}
