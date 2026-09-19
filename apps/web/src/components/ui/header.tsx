import { Button } from '@nova/ui';

import { Icon } from './icon';
import { Logo } from './logo';
import { navItems } from './site-navigation';

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
          <Button
            className="icon-button site-header__menu"
            type="button"
            onClick={onMenu}
            aria-label="باز کردن منو"
          >
            <Icon name="menu" />
          </Button>
          <nav className="site-nav" aria-label="دسته‌بندی‌های اصلی">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="site-nav__link">
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <Logo />

        <div className="site-header__actions flex items-center gap-0.5">
          <Button className="icon-button" type="button" onClick={onSearch} aria-label="جست‌وجو">
            <Icon name="search" />
          </Button>
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
