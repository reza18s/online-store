import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';

import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';
import { Logo } from '@/shared/ui/logo';
import { navItems } from '@/shared/ui/site-navigation';
import type { CatalogAudience, CatalogCategory } from '@nova/api-client';

export function Header({
  cartCount,
  onMenu,
  onSearchSubmit,
  categoryAudience,
  quickCategories,
  isCategoryNavLoading,
}: {
  cartCount: number;
  onMenu: () => void;
  onSearchSubmit: (query: string) => void;
  categoryAudience?: CatalogAudience;
  quickCategories: readonly Pick<CatalogCategory, 'slug' | 'name'>[];
  isCategoryNavLoading: boolean;
}) {
  const [isCompact, setIsCompact] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasQuickNav = isCategoryNavLoading || quickCategories.length > 0;

  useEffect(() => {
    const updateCompactState = () => {
      setIsCompact(window.innerWidth > 1024 && window.scrollY > 48);
    };

    updateCompactState();
    window.addEventListener('scroll', updateCompactState, { passive: true });
    window.addEventListener('resize', updateCompactState);

    return () => {
      window.removeEventListener('scroll', updateCompactState);
      window.removeEventListener('resize', updateCompactState);
    };
  }, []);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  const openSearch = () => {
    setSearchTerm('');
    setIsSearchOpen(true);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = searchTerm.trim();
    if (!normalizedQuery) {
      searchInputRef.current?.focus();
      return;
    }

    onSearchSubmit(normalizedQuery);
    closeSearch();
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSearch();
    }
  };

  const searchButton = (className: string) => (
    <Button
      className={`icon-button ${className}`}
      variant="ghost"
      size="icon"
      type="button"
      onClick={openSearch}
      aria-label="جست‌وجوی محصولات"
    >
      <Icon name="search" />
    </Button>
  );

  const menuButton = (
    <Button
      className="icon-button site-header__menu"
      variant="ghost"
      size="icon"
      type="button"
      onClick={onMenu}
      aria-label="باز کردن منو"
    >
      <Icon name="menu" />
    </Button>
  );

  const searchMenuButton = (
    <Button
      className="icon-button site-header__menu site-header__search-menu"
      variant="ghost"
      size="icon"
      type="button"
      onClick={onMenu}
      aria-label="باز کردن منو"
    >
      <Icon name="menu" />
    </Button>
  );

  const accountLink = (
    <a
      className="icon-button site-header__account"
      href="/account"
      aria-label="ورود یا حساب کاربری"
    >
      <Icon name="user" size={17} />
      <span className="site-header__account-label">ورود / حساب</span>
    </a>
  );

  const cartLink = (
    <a
      className="cart-button inline-flex min-h-10 items-center justify-center rounded-editorial bg-primary text-primary-foreground transition-colors duration-150 hover:bg-primary-hover"
      href="/cart"
      aria-label={`سبد خرید، ${cartCount} کالا`}
    >
      <Icon name="bag" size={18} />
      {cartCount > 0 ? (
        <span className="cart-button__count" aria-hidden="true">
          {cartCount}
        </span>
      ) : null}
    </a>
  );

  const headerClassName = [
    'site-header',
    hasQuickNav && !isSearchOpen ? 'site-header--with-quick-nav' : '',
    isCompact ? 'site-header--compact' : '',
    isSearchOpen ? 'site-header--search-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={headerClassName}>
      <div className="site-header__inner">
        {isSearchOpen ? (
          <form
            className="site-header__search"
            role="search"
            onSubmit={submitSearch}
            onKeyDown={handleSearchKeyDown}
          >
            {searchMenuButton}
            <div className="site-header__search-field">
              <Button
                className="icon-button site-header__search-close"
                variant="ghost"
                size="icon"
                type="button"
                onClick={closeSearch}
                aria-label="بستن جست‌وجو"
              >
                <Icon name="close" />
              </Button>
              <input
                ref={searchInputRef}
                className="site-header__search-input"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="جست‌وجوی محصولات، برندها و ..."
                aria-label="جست‌وجوی محصولات، برندها و ..."
                dir="rtl"
                autoComplete="off"
              />
              <Button
                className="icon-button site-header__search-submit"
                variant="ghost"
                size="icon"
                type="submit"
                aria-label="جست‌وجو"
              >
                <Icon name="search" />
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="site-header__nav-wrap">
              {menuButton}
              {searchButton('site-header__mobile-search')}
              <nav className="site-nav" aria-label="دسته‌بندی‌های اصلی">
                {navItems.map((item) => {
                  const isActive =
                    categoryAudience !== undefined && item.href === `/category/${categoryAudience}`;

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={
                        'site-nav__link' +
                        (isActive ? ' is-active' : '') +
                        (item.href === '/products/sale' ? ' site-nav__link--sale' : '')
                      }
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.label}
                    </a>
                  );
                })}
              </nav>
            </div>

            <Logo />

            <div className="site-header__actions">
              {searchButton('site-header__desktop-search')}
              <a
                className="icon-button site-header__favorite"
                href="/products"
                aria-label="علاقه‌مندی‌ها"
              >
                <Icon name="heart" />
              </a>
              {accountLink}
              {cartLink}
            </div>

            {isCategoryNavLoading ? (
              <div className="site-header__quick-nav" aria-hidden="true">
                <div className="site-header__quick-nav-skeleton" aria-hidden="true">
                  {Array.from({ length: 8 }, (_, index) => (
                    <span key={index} />
                  ))}
                </div>
              </div>
            ) : quickCategories.length ? (
              <nav className="site-header__quick-nav" aria-label="دسته‌بندی سریع">
                {quickCategories.slice(0, 10).map((category) => (
                  <a
                    key={category.slug}
                    href={`/products?category=${encodeURIComponent(category.slug)}`}
                  >
                    {category.name}
                  </a>
                ))}
              </nav>
            ) : null}
          </>
        )}
      </div>
    </header>
  );
}
