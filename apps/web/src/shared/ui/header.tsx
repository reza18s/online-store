import { useEffect, useState } from 'react';

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
}: {
  cartCount: number;
  onMenu: () => void;
  onSearch: () => void;
  categoryAudience?: CatalogAudience;
}) {
  const [isCompact, setIsCompact] = useState(false);

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

  const searchButton = (className: string) => (
    <Button
      className={`icon-button ${className}`}
      variant="ghost"
      size="icon"
      type="button"
      onClick={onSearch}
      aria-label="جست‌وجوی محصولات"
    >
      <Icon name="search" />
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

  return (
    <header
      className={`site-header sticky top-0 z-[200] border-b border-border bg-background backdrop-blur${isCompact ? ' site-header--compact' : ''}`}
    >
      <div className="shell site-header__inner mx-auto w-[calc(100%-2rem)] max-w-[1280px]">
        <div className="site-header__nav-wrap">
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
          {searchButton('site-header__mobile-search')}
          <nav className="site-nav" aria-label="دسته‌بندی‌های اصلی">
            {navItems.map((item) => {
              const isActive =
                categoryAudience !== undefined && item.href === `/category/${categoryAudience}`;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`site-nav__link${isActive ? ' is-active' : ''}${item.href === '/products/sale' ? ' site-nav__link--sale' : ''}`}
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
      </div>
    </header>
  );
}
