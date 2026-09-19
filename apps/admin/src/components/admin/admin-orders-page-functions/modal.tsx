import { useEffect, useRef, type ReactNode } from 'react';

import { Button } from '@nova/ui';

import { Icon } from '../../ui/icon';

import { MODAL_FOCUSABLE_SELECTOR } from '../../../pages/admin/admin-orders-page-shared';

import { getModalFocusWrapIndex } from './get-modal-focus-wrap-index';

export function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hidden && element.getClientRects().length > 0);
      const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const wrapIndex = getModalFocusWrapIndex(activeIndex, focusable.length, event.shiftKey);
      if (wrapIndex === null) return;

      event.preventDefault();
      focusable[wrapIndex]?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/45 p-4 pt-[10vh]"
      role="presentation"
    >
      <div
        aria-labelledby="admin-order-dialog-title"
        aria-modal="true"
        className="w-full max-w-xl border border-border bg-surface p-5 shadow-float md:p-7"
        role="dialog"
        ref={dialogRef}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-primary">تأیید عملیات</p>
            <h2 className="mt-2 text-xl font-semibold" id="admin-order-dialog-title">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Button
            ref={closeRef}
            aria-label="بستن پنجره"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" size={20} />
          </Button>
        </div>
        <div className="pt-5">{children}</div>
      </div>
    </div>
  );
}
