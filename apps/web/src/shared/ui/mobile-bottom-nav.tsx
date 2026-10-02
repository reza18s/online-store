import { Icon } from '@/shared/ui/icon';
import type { CatalogAudience } from '@nova/api-client';

export function MobileBottomNav({
  cartCount,
  categoryAudience,
}: {
  cartCount: number;
  categoryAudience?: CatalogAudience;
}) {
  return (
    <nav
      className={`mobile-bottom-nav${categoryAudience ? ' mobile-bottom-nav--category' : ''}`}
      aria-label="ناوبری سریع"
    >
      {categoryAudience ? (
        <>
          <a href="/">
            <Icon name="home" size={20} />
            <span>خانه</span>
          </a>
          <a href="/search">
            <Icon name="search" size={20} />
            <span>جست‌وجو</span>
          </a>
          <a href={`/category/${categoryAudience}`} aria-current="page">
            <Icon name="grid" size={20} />
            <span>دسته‌ها</span>
          </a>
          <a href="/cart">
            <span className="mobile-bottom-nav__bag">
              <Icon name="bag" size={20} />
              {cartCount ? <b>{cartCount}</b> : null}
            </span>
            <span>سبد</span>
          </a>
          <a href="/account">
            <Icon name="user" size={20} />
            <span>حساب</span>
          </a>
        </>
      ) : (
        <>
          <a href="/">
            <Icon name="home" size={20} />
            <span>خانه</span>
          </a>
          <a href="/products">
            <Icon name="grid" size={20} />
            <span>فروشگاه</span>
          </a>
          <a href="/search">
            <Icon name="search" size={20} />
            <span>جست‌وجو</span>
          </a>
          <a href="/cart">
            <span className="mobile-bottom-nav__bag">
              <Icon name="bag" size={20} />
              {cartCount ? <b>{cartCount}</b> : null}
            </span>
            <span>سبد</span>
          </a>
          <a href="/account">
            <Icon name="user" size={20} />
            <span>حساب</span>
          </a>
        </>
      )}
    </nav>
  );
}
