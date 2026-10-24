import { useCallback, useEffect, useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';

import { Input as UiInput } from '@nova/ui';

import { Icon, type IconName } from '@/shared/ui/icon';

import { Logo } from '@/shared/ui/site-shell';

import { AdminLogoutButton } from '@/features/auth';

import { hasAdminStaffRole, type AdminStaffRole } from '@/features/orders';

import { navigateToRoute } from '@/app/routing/navigate-to-route';

import '@/styles/admin-reference.css';

type AdminNavigationItem = {
  key: string;
  label: string;
  icon: IconName;
  requiredRoles: AdminStaffRole[];
};

const ALL_STAFF_ROLES: AdminStaffRole[] = ['support', 'operations', 'admin'];
const ADMIN_ONLY: AdminStaffRole[] = ['admin'];
const OPERATIONS_OR_ADMIN: AdminStaffRole[] = ['operations', 'admin'];

function loadGsapModule() {
  return import('gsap');
}

const ADMIN_NAVIGATION_DEFINITIONS: Array<[string, string, IconName, AdminStaffRole[]]> = [
  ['admin', 'داشبورد', 'home', ADMIN_ONLY],
  ['catalog', 'محصولات', 'bag', ALL_STAFF_ROLES],
  ['catalog/categories', 'دسته‌بندی‌ها', 'layers', ALL_STAFF_ROLES],
  ['orders', 'سفارش‌ها', 'package', ALL_STAFF_ROLES],
  ['customers', 'مشتریان', 'users', ALL_STAFF_ROLES],
  ['payments', 'پرداخت‌ها', 'bag', ADMIN_ONLY],
  ['content', 'محتوا', 'book', ADMIN_ONLY],
  ['audit', 'گزارش‌ها', 'eye', ADMIN_ONLY],
  ['notifications', 'اعلان‌ها', 'bell', OPERATIONS_OR_ADMIN],
  ['inventory', 'موجودی', 'warehouse', OPERATIONS_OR_ADMIN],
];

const ADMIN_NAVIGATION: AdminNavigationItem[] = ADMIN_NAVIGATION_DEFINITIONS.map(
  ([key, label, icon, requiredRoles]) => ({ key, label, icon, requiredRoles }),
);

const ADMIN_MOBILE_NAVIGATION_DEFINITIONS: Array<[string, string, IconName, AdminStaffRole[]]> = [
  ['admin', 'داشبورد', 'home', ADMIN_ONLY],
  ['orders', 'سفارش‌ها', 'package', ALL_STAFF_ROLES],
  ['catalog', 'محصولات', 'bag', ALL_STAFF_ROLES],
  ['content', 'محتوا', 'book', ADMIN_ONLY],
  ['inventory', 'موجودی', 'warehouse', OPERATIONS_OR_ADMIN],
];

const ADMIN_MOBILE_NAVIGATION: AdminNavigationItem[] = ADMIN_MOBILE_NAVIGATION_DEFINITIONS.map(
  ([key, label, icon, requiredRoles]) => ({ key, label, icon, requiredRoles }),
);

function filterNavigation(
  navigation: AdminNavigationItem[],
  staffRoles: readonly string[] | undefined,
): AdminNavigationItem[] {
  return navigation.filter((item) => hasAdminStaffRole(staffRoles, item.requiredRoles));
}

function getNavigationHref(key: string): string {
  return key === 'admin' ? '/admin' : '/admin/' + key;
}

function isModifiedNavigationClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function getAdminWorkspaceNavigation(
  staffRoles: readonly string[] | undefined,
): AdminNavigationItem[] {
  return filterNavigation(ADMIN_NAVIGATION, staffRoles);
}

export function getAdminMobileNavigation(
  staffRoles: readonly string[] | undefined,
): AdminNavigationItem[] {
  return filterNavigation(ADMIN_MOBILE_NAVIGATION, staffRoles);
}

export function AdminWorkspaceLayout({
  page,
  adminDisplayName,
  staffRoles,
  children,
}: {
  page: string;
  adminDisplayName: string;
  staffRoles?: readonly string[];
  children: ReactNode;
}) {
  const nav = getAdminWorkspaceNavigation(staffRoles);
  const mobileNav = getAdminMobileNavigation(staffRoles);
  const canViewNotifications = hasAdminStaffRole(staffRoles, OPERATIONS_OR_ADMIN);
  const homeHref = hasAdminStaffRole(staffRoles, ADMIN_ONLY) ? '/admin' : '/admin/catalog';
  const isNavActive = (key: string) =>
    page === key ||
    (key === 'catalog' && page.startsWith('catalog/products')) ||
    (key !== 'catalog' && page.startsWith(key + '/'));

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<{ kill: () => void } | null>(null);
  const animationIdRef = useRef(0);
  const previousBodyOverflowRef = useRef<string | null>(null);
  const afterCloseRef = useRef<(() => void) | null>(null);
  const isClosingRef = useRef(false);

  const finishClose = useCallback((restoreTriggerFocus = true) => {
    const dialog = dialogRef.current;
    timelineRef.current?.kill();
    timelineRef.current = null;
    if (dialog?.open) dialog.close();
    if (previousBodyOverflowRef.current !== null) {
      document.body.style.overflow = previousBodyOverflowRef.current;
      previousBodyOverflowRef.current = null;
    }
    const animatedElements = [
      scrimRef.current,
      panelRef.current,
      ...Array.from(panelRef.current?.querySelectorAll<HTMLElement>('.admin-reference-mobile-nav-link') ?? []),
    ];
    for (const element of animatedElements) {
      if (!element) continue;
      element.style.removeProperty('transform');
      element.style.removeProperty('opacity');
      element.style.removeProperty('visibility');
    }
    isClosingRef.current = false;
    if (restoreTriggerFocus) menuButtonRef.current?.focus({ preventScroll: true });
    const afterClose = afterCloseRef.current;
    afterCloseRef.current = null;
    afterClose?.();
  }, []);

  const closeNavigation = (afterClose?: () => void) => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!dialog?.open || !panel || !scrim || isClosingRef.current) return;
    isClosingRef.current = true;
    afterCloseRef.current = afterClose ?? null;
    timelineRef.current?.kill();
    const animationId = ++animationIdRef.current;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishClose();
      return;
    }

    void loadGsapModule().then(({ gsap }) => {
      if (!dialog.open || animationId !== animationIdRef.current) return;
      const links = Array.from(panel.querySelectorAll<HTMLElement>('.admin-reference-mobile-nav-link'));
      timelineRef.current = gsap.timeline({ onComplete: finishClose })
        .to(links, { x: 10, autoAlpha: 0, duration: 0.12, stagger: 0.012, ease: 'power1.in' }, 0)
        .to(panel, { xPercent: 100, duration: 0.22, ease: 'power2.in' }, 0)
        .to(scrim, { autoAlpha: 0, duration: 0.18, ease: 'power1.in' }, 0);
    }).catch(() => finishClose());
  };

  const openNavigation = () => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!dialog || !panel || !scrim || dialog.open) return;
    timelineRef.current?.kill();
    const animationId = ++animationIdRef.current;
    isClosingRef.current = false;
    afterCloseRef.current = null;
    previousBodyOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    requestAnimationFrame(() => closeButtonRef.current?.focus({ preventScroll: true }));

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    void loadGsapModule().then(({ gsap }) => {
      if (!dialog.open || animationId !== animationIdRef.current) return;
      const links = Array.from(panel.querySelectorAll<HTMLElement>('.admin-reference-mobile-nav-link'));
      timelineRef.current = gsap.timeline()
        .fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'power1.out' }, 0)
        .fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.26, ease: 'power2.out' }, 0)
        .fromTo(links, { x: 12, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.16, stagger: 0.018, ease: 'power1.out' }, 0.07);
    });
  };

  const handleNavigationDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab') return;
    const dialog = event.currentTarget;
    const focusableElements = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.getClientRects().length > 0);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    if (!firstFocusable || !lastFocusable) return;

    const activeElement = document.activeElement;
    if (!dialog.contains(activeElement)) {
      event.preventDefault();
      firstFocusable.focus();
    } else if (event.shiftKey && activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    } else if (!event.shiftKey && activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  };

  const handleMobileNavigationClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (isModifiedNavigationClick(event)) return;
    event.preventDefault();
    closeNavigation(() => navigateToRoute(href));
  };

  useEffect(() => () => {
    timelineRef.current?.kill();
    if (dialogRef.current?.open) dialogRef.current.close();
    if (previousBodyOverflowRef.current !== null) {
      document.body.style.overflow = previousBodyOverflowRef.current;
    }
  }, []);

  useEffect(() => {
    const tabletBreakpoint = window.matchMedia('(min-width: 768px)');
    const closeDrawerAtTablet = (event: MediaQueryListEvent) => {
      if (!event.matches || !dialogRef.current?.open) return;
      animationIdRef.current += 1;
      isClosingRef.current = true;
      afterCloseRef.current = null;
      finishClose(false);
    };
    tabletBreakpoint.addEventListener('change', closeDrawerAtTablet);
    return () => tabletBreakpoint.removeEventListener('change', closeDrawerAtTablet);
  }, [finishClose]);

  return (
    <div className="admin-shell admin-reference-shell min-h-svh bg-background text-foreground">
      <aside className="admin-sidebar admin-reference-sidebar flex-[0_0_194px] px-3 py-6">
        <Logo descriptor="ADMIN PANEL" href={homeHref} ariaLabel="NOVA، فضای مدیریت" />
        <span className="admin-sidebar__label">فضای مدیریت</span>
        <nav className="flex flex-col gap-1" aria-label="ناوبری مدیریت">
          {nav.map((item) => {
            const href = getNavigationHref(item.key);
            const active = isNavActive(item.key);
            return (
              <a
                className={'flex min-h-11 items-center gap-3 rounded-md px-3 text-xs transition-colors ' + (active ? 'is-active' : '')}
                href={href}
                key={item.key}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                title={item.label}
              >
                <Icon name={item.icon} size={18} />
                <span className="admin-reference-nav-label">{item.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-border pt-5">
          <div className="flex items-center gap-3 px-2">
            <img
              className="h-10 w-10 rounded-full object-cover"
              src="/assets/nova-hero-men.webp"
              alt={'پروفایل ' + adminDisplayName}
            />
            <div className="min-w-0 text-right">
              <strong className="block truncate text-xs">{adminDisplayName}</strong>
              <small className="mt-1 block text-xs opacity-70">نشست فعال</small>
            </div>
          </div>
          <AdminLogoutButton className="mt-4 flex min-h-10 w-full items-center gap-2 border-0 bg-transparent px-2 text-right text-xs opacity-75 transition-colors hover:opacity-100 disabled:opacity-50" />
        </div>
      </aside>

      <section className="admin-content admin-reference-content min-h-svh w-full">
        <header
          className="admin-topbar admin-reference-topbar !flex-row min-h-[68px] gap-3 bg-surface px-4 py-3 md:px-6"
          dir="ltr"
        >
          <div className="admin-reference-mobile-head w-full items-center justify-between" dir="rtl">
            <button
              className="icon-button admin-reference-mobile-menu-button"
              type="button"
              aria-label="باز کردن ناوبری مدیریت"
              aria-haspopup="dialog"
              aria-controls="admin-mobile-navigation"
              onClick={openNavigation}
              ref={menuButtonRef}
            >
              <Icon name="menu" size={20} />
            </button>
            <Logo descriptor="ATELIER EDITORIAL" href={homeHref} ariaLabel="NOVA، فضای مدیریت" />
            <div className="flex items-center gap-2">
              {canViewNotifications ? (
                <a className="icon-button" href="/admin/notifications" aria-label="اعلان‌ها">
                  <Icon name="bell" size={19} />
                </a>
              ) : null}
              <img
                className="h-9 w-9 rounded-full bg-secondary object-cover"
                src="/assets/nova-hero-men.webp"
                alt={'پروفایل ' + adminDisplayName}
              />
            </div>
          </div>
          <form
            className="hidden w-full max-w-[375px] items-center gap-2 rounded-control border border-border bg-background px-3 md:flex"
            dir="rtl"
            action="/admin/catalog"
            method="get"
          >
            <Icon name="search" size={18} className="text-muted-foreground" />
            <UiInput
              className="min-h-9 min-w-0 flex-1 bg-transparent text-xs outline-none"
              aria-label="جست‌وجو در پنل مدیریت"
              name="q"
              placeholder="جست‌وجو در محصولات ..."
            />
          </form>
          <div className="admin-reference-desktop-head ml-auto items-center gap-4" dir="rtl">
            {canViewNotifications ? (
              <a
                className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-secondary"
                href="/admin/notifications"
                aria-label="اعلان‌ها"
              >
                <Icon name="bell" size={19} />
              </a>
            ) : null}
            <img
              className="h-9 w-9 rounded-full bg-secondary object-cover"
              src="/assets/nova-hero-men.webp"
              alt={'پروفایل ' + adminDisplayName}
            />
            <span className="hidden text-xs text-muted-foreground lg:inline">
              نشست فعال
            </span>
          </div>
        </header>
        <div className="admin-page admin-reference-page bg-background p-4 pb-24 md:p-6 md:pb-8 lg:p-8">{children}</div>
      </section>

      <nav
        className="admin-reference-bottom-nav fixed inset-x-0 bottom-0 z-30 flex min-h-[66px] items-stretch justify-around border-t border-border bg-surface/95 px-2 pb-[max(7px,env(safe-area-inset-bottom))] pt-1 shadow-float backdrop-blur md:hidden"
        aria-label="ناوبری مدیریت موبایل"
      >
        {mobileNav.map(({ key, label, icon }) => {
          const active = isNavActive(key);
          return (
            <a
              className={'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs ' + (active ? 'text-primary' : 'text-muted-foreground')}
              href={getNavigationHref(key)}
              key={key}
              aria-current={active ? 'page' : undefined}
            >
              <Icon name={icon} size={19} />
              <span>{label}</span>
            </a>
          );
        })}
      </nav>

      <dialog
        ref={dialogRef}
        id="admin-mobile-navigation"
        className="admin-reference-mobile-dialog"
        aria-labelledby="admin-mobile-navigation-title"
        onKeyDown={handleNavigationDialogKeyDown}
        onCancel={(event) => {
          event.preventDefault();
          closeNavigation();
        }}
      >
        <div
          className="admin-reference-mobile-dialog__scrim"
          aria-hidden="true"
          ref={scrimRef}
          onClick={() => closeNavigation()}
        />
        <aside className="admin-reference-mobile-dialog__panel" ref={panelRef}>
          <header className="admin-reference-mobile-dialog__header">
            <span id="admin-mobile-navigation-title">ناوبری مدیریت</span>
            <button
              className="icon-button"
              type="button"
              aria-label="بستن ناوبری"
              onClick={() => closeNavigation()}
              ref={closeButtonRef}
              autoFocus
            >
              <Icon name="close" size={20} />
            </button>
          </header>
          <div className="admin-reference-mobile-dialog__identity">
            <img src="/assets/nova-hero-men.webp" alt="" />
            <div>
              <strong>{adminDisplayName}</strong>
              <small>نشست فعال</small>
            </div>
          </div>
          <nav className="admin-reference-mobile-dialog__nav" aria-label="همه بخش‌های مجاز مدیریت">
            {nav.map((item) => {
              const href = getNavigationHref(item.key);
              const active = isNavActive(item.key);
              return (
                <a
                  className={'admin-reference-mobile-nav-link ' + (active ? 'is-active' : '')}
                  href={href}
                  key={item.key}
                  aria-current={active ? 'page' : undefined}
                  data-manual-navigation
                  onClick={(event) => handleMobileNavigationClick(event, href)}
                >
                  <Icon name={item.icon} size={19} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
          <div className="admin-reference-mobile-dialog__footer">
            <AdminLogoutButton className="flex min-h-11 w-full items-center gap-3 rounded-md border-0 bg-transparent px-3 text-right text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50" />
          </div>
        </aside>
      </dialog>
    </div>
  );
}
