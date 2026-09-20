import { useRef } from 'react';

import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';
import { Logo } from '@/shared/ui/logo';
import { navItems } from '@/shared/ui/site-navigation';
import { useDialogFocus } from '@/shared/ui/use-dialog-focus';

export function MenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const handleDialogKeyDown = useDialogFocus(open, drawerRef, closeButtonRef);

  if (!open) return null;
  return (
    <div
      className="modal-layer modal-layer--drawer fixed inset-0 z-[500] flex items-start"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        ref={drawerRef}
        className="menu-drawer h-full max-w-[380px] w-[min(86vw,380px)] bg-surface shadow-float"
        role="dialog"
        aria-modal="true"
        aria-label="منوی فروشگاه"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
            return;
          }
          handleDialogKeyDown(event);
        }}
      >
        <div className="menu-drawer__top">
          <Logo />
          <Button
            ref={closeButtonRef}
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="بستن منو"
          >
            <Icon name="close" />
          </Button>
        </div>
        <nav>
          {navItems.map((item) => (
            <a href={item.href} key={item.href} onClick={onClose}>
              {item.label}
              <Icon name="arrow-left" size={16} />
            </a>
          ))}
        </nav>
        <div className="menu-drawer__footer">
          <a href="#account">ورود به حساب کاربری</a>
          <a href="#support">پشتیبانی و تماس</a>
        </div>
      </aside>
    </div>
  );
}
