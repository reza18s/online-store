import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';
import { Logo } from '@/shared/ui/logo';
import { navItems } from '@/shared/ui/site-navigation';
import type { CatalogAudience } from '@nova/api-client';

export function Header({
  cartCount,
  onMenu,
  onSearch,
  categoryAudience,
  isHomePage,
}: {
  cartCount: number;
  onMenu: () => void;
  onSearch: () => void;
  categoryAudience?: CatalogAudience;
  isHomePage?: boolean;
}) {
  const searchButton = (
    <Button
      className={`icon-button${categoryAudience ? ' site-header__search' : ''}`}
      variant="ghost"
      size="icon"
      type="button"
      onClick={onSearch}
      aria-label="جست‌وجوی محصولات"
    >
      <Icon name="search" />
      {categoryAudience ? <span>جست‌وجوی محصولات، دسته‌ها یا الهام‌ها…</span> : null}
    </Button>
  );
  const accountLink = (
    <a className="icon-button site-header__account" href="/account" aria-label="حساب کاربری">
      <Icon name="user" />
    </a>
  );
  const cartLink = (
    <a
      className="cart-button inline-flex min-h-10 items-center gap-2 rounded-editorial bg-primary px-3 text-primary-foreground transition-transform duration-150 hover:-translate-y-px hover:bg-primary-hover"
      href="/cart"
      aria-label={`سبد خرید، ${cartCount} کالا`}
    >
      <Icon name="bag" size={18} />
      <span className="cart-button__label">سبد</span>
      <span className="cart-button__count" aria-hidden="true">
        {cartCount}
      </span>
    </a>
  );

  return (
    <header
      className={`site-header sticky top-0 z-[200] border-b border-border bg-background backdrop-blur${categoryAudience ? ' site-header--category' : ''}${isHomePage ? ' site-header--home' : ''}`}
    >
      <div className="shell site-header__inner mx-auto w-[calc(100%-2rem)] max-w-[1280px]">
        <div className="site-header__nav-wrap flex items-center gap-3.5">
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
          <nav className="site-nav" aria-label="دسته‌بندی‌های اصلی">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`site-nav__link${categoryAudience && item.href === `/category/${categoryAudience}` ? ' is-active' : ''}`}
                aria-current={
                  categoryAudience && item.href === `/category/${categoryAudience}`
                    ? 'page'
                    : undefined
                }
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <Logo />

        {categoryAudience ? (
          <div className="site-header__tools">
            <div className="site-header__utility">
              {accountLink}
              {cartLink}
            </div>
            <div className="site-header__search-wrap">{searchButton}</div>
          </div>
        ) : (
          <div className="site-header__actions flex items-center gap-0.5">
            {searchButton}
            {accountLink}
            {cartLink}
          </div>
        )}
      </div>
    </header>
  );
}
