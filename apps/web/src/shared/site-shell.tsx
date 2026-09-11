import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react';

import type { CatalogSearchSuggestion } from '@nova/api-client';

import { useCatalogSuggestions } from '../features/catalog/catalog-api';
import { Icon } from './icon';

export const navItems = [
  { label: 'زنانه', href: '#category/women' },
  { label: 'مردانه', href: '#category/men' },
  { label: 'بچگانه', href: '#category/children' },
  { label: 'اکسسوری', href: '#products/accessories' },
  { label: 'جدیدترین‌ها', href: '#products/new' },
  { label: 'کالکشن‌ها', href: '#campaign' },
  { label: 'تخفیف', href: '#products/sale' },
];

export function Logo({ descriptor = 'ATELIER EDITORIAL' }: { descriptor?: string } = {}) {
  return (
    <a
      className="brand-lockup inline-flex w-max flex-col items-center leading-none"
      href="#home"
      aria-label="NOVA، صفحه اصلی"
    >
      <span className="brand-lockup__name">NOVA</span>
      <span className="brand-lockup__descriptor !text-muted-foreground">{descriptor}</span>
    </a>
  );
}

export function Header({
  cartCount,
  onMenu,
  onSearch,
}: {
  cartCount: number;
  onMenu: () => void;
  onSearch: () => void;
}) {
  return (
    <header className="site-header sticky top-0 z-[200] border-b border-border bg-background backdrop-blur">
      <div className="shell site-header__inner mx-auto w-[calc(100%-2rem)] max-w-[1280px]">
        <div className="site-header__nav-wrap flex items-center gap-3.5">
          <button
            className="icon-button site-header__menu"
            type="button"
            onClick={onMenu}
            aria-label="باز کردن منو"
          >
            <Icon name="menu" />
          </button>
          <nav className="site-nav flex items-center" aria-label="دسته‌بندی‌های اصلی">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="site-nav__link">
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <Logo />

        <div className="site-header__actions flex items-center gap-0.5">
          <button className="icon-button" type="button" onClick={onSearch} aria-label="جست‌وجو">
            <Icon name="search" />
          </button>
          <a className="icon-button site-header__account" href="#account" aria-label="حساب کاربری">
            <Icon name="user" />
          </a>
          <a
            className="cart-button inline-flex min-h-10 items-center gap-2 rounded-editorial bg-primary px-3 text-primary-foreground transition-transform duration-150 hover:-translate-y-px hover:bg-primary-hover"
            href="#cart"
            aria-label={`سبد خرید، ${cartCount} کالا`}
          >
            <Icon name="bag" size={18} />
            <span className="cart-button__label">سبد</span>
            <span className="cart-button__count" aria-hidden="true">
              {cartCount}
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}

export function MobileBottomNav({ cartCount }: { cartCount: number }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="ناوبری سریع">
      <a href="#home">
        <Icon name="home" size={20} />
        <span>خانه</span>
      </a>
      <a href="#products">
        <Icon name="grid" size={20} />
        <span>فروشگاه</span>
      </a>
      <a href="#search">
        <Icon name="search" size={20} />
        <span>جست‌وجو</span>
      </a>
      <a href="#cart">
        <span className="mobile-bottom-nav__bag">
          <Icon name="bag" size={20} />
          {cartCount ? <b>{cartCount}</b> : null}
        </span>
        <span>سبد</span>
      </a>
      <a href="#account">
        <Icon name="user" size={20} />
        <span>حساب</span>
      </a>
    </nav>
  );
}

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

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hidden &&
      !element.matches(':disabled') &&
      !element.closest('[inert], [aria-hidden="true"]') &&
      element.tabIndex >= 0,
  );
}

function isFocusableElement(element: Element | null): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    element.isConnected &&
    !element.hidden &&
    !element.matches(':disabled') &&
    !element.closest('[inert], [aria-hidden="true"]') &&
    element.tabIndex >= 0
  );
}

function useDialogFocus(
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

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleDialogKeyDown = useDialogFocus(open, dialogRef, inputRef);
  const suggestionQuery = useCatalogSuggestions(debouncedQuery, open);
  const normalizedQuery = query.trim();

  useEffect(() => {
    const nextQuery = query.trim();
    const timeout = window.setTimeout(() => setDebouncedQuery(nextQuery), 220);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        window.localStorage.getItem('nova.recent-searches') ?? '[]',
      ) as unknown;
      if (Array.isArray(saved))
        setRecent(saved.filter((item): item is string => typeof item === 'string').slice(0, 5));
    } catch {
      setRecent([]);
    }
  }, []);

  const rememberSearch = (term: string) => {
    const normalized = term.trim();
    if (!normalized) return;
    const next = [normalized, ...recent.filter((item) => item !== normalized)].slice(0, 5);
    setRecent(next);
    try {
      window.localStorage.setItem('nova.recent-searches', JSON.stringify(next));
    } catch {
      // Local search history is an enhancement; private browsing may reject storage.
    }
  };

  const submitSearch = (term: string) => {
    const normalized = term.trim();
    if (!normalized) return;
    rememberSearch(normalized);
    window.location.hash = `products?q=${encodeURIComponent(normalized)}`;
    onClose();
  };

  const openSuggestion = (suggestion: CatalogSearchSuggestion) => {
    rememberSearch(normalizedQuery);
    const destination =
      suggestion.type === 'CATEGORY'
        ? `products?category=${encodeURIComponent(suggestion.slug)}`
        : `product/${encodeURIComponent(suggestion.slug)}`;
    window.location.hash = destination;
    onClose();
  };

  if (!open) return null;
  const suggestions = suggestionQuery.data ?? [];
  const isSearching = Boolean(normalizedQuery);
  const isWaitingForDebounce = isSearching && debouncedQuery !== normalizedQuery;
  const isSuggestionPending = isSearching && (isWaitingForDebounce || suggestionQuery.isPending);
  return (
    <div
      className="modal-layer fixed inset-0 z-[500] flex items-start justify-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="search-dialog w-full max-w-3xl bg-surface shadow-float"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
            return;
          }
          handleDialogKeyDown(event);
        }}
      >
        <div className="search-dialog__top">
          <div>
            <span className="section-heading__eyebrow">NOVA / SEARCH</span>
            <h2 id="search-title">چه چیزی پیدا می‌کنید؟</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="بستن جست‌وجو">
            <Icon name="close" />
          </button>
        </div>
        <form
          className="search-field"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch(query);
          }}
        >
          <Icon name="search" size={19} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جست‌وجوی محصول، دسته یا کالکشن"
            aria-label="جست‌وجوی محصول، دسته یا کالکشن"
          />
        </form>
        <div className="search-dialog__results" aria-live="polite">
          <span className="section-heading__eyebrow">
            {normalizedQuery ? 'نتایج جست‌وجو' : 'پیشنهادهای نوا'}
          </span>
          {isSuggestionPending ? (
            <p className="search-empty">در حال جست‌وجو...</p>
          ) : suggestionQuery.isError ? (
            <div
              className="flex items-center justify-between gap-3 py-4 text-sm text-warning"
              role="alert"
            >
              <span>جست‌وجو در دسترس نیست.</span>
              <button
                className="text-primary underline"
                type="button"
                onClick={() => void suggestionQuery.refetch()}
              >
                تلاش دوباره
              </button>
            </div>
          ) : suggestions.length ? (
            suggestions.map((suggestion) => (
              <a
                href={
                  suggestion.type === 'CATEGORY'
                    ? `#products?category=${encodeURIComponent(suggestion.slug)}`
                    : `#product/${encodeURIComponent(suggestion.slug)}`
                }
                key={`${suggestion.type}:${suggestion.id}`}
                onClick={() => openSuggestion(suggestion)}
              >
                {suggestion.imageUrl ? (
                  <img src={suggestion.imageUrl} alt={suggestion.imageAlt ?? ''} />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center bg-secondary text-muted-foreground">
                    <Icon name={suggestion.type === 'CATEGORY' ? 'layers' : 'shirt'} size={19} />
                  </span>
                )}
                <span>
                  <strong>{suggestion.label}</strong>
                  <small>{suggestion.type === 'CATEGORY' ? 'دسته‌بندی' : 'محصول'}</small>
                </span>
                <Icon name="arrow-left" size={16} />
              </a>
            ))
          ) : normalizedQuery ? (
            <p className="search-empty">نتیجه‌ای پیدا نشد؛ عبارت دیگری را امتحان کنید.</p>
          ) : (
            <p className="search-empty">برای شروع، نام محصول یا دسته را وارد کنید.</p>
          )}
          {!query.trim() && recent.length ? (
            <div className="mt-5 border-t border-border pt-4">
              <span className="section-heading__eyebrow">جست‌وجوهای اخیر</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {recent.map((item) => (
                  <button
                    className="border border-border bg-surface px-3 py-2 text-xs hover:border-primary hover:text-primary"
                    type="button"
                    key={item}
                    onClick={() => {
                      setQuery(item);
                      submitSearch(item);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

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
          <button
            ref={closeButtonRef}
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="بستن منو"
          >
            <Icon name="close" />
          </button>
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
