import { Icon } from './icon';

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
