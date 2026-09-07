import { useEffect, useMemo, useRef, useState, type ReactNode, type SVGProps } from 'react';

import { Button } from '@nova/ui';

type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'bag'
  | 'bell'
  | 'book'
  | 'calendar'
  | 'check'
  | 'chevron-down'
  | 'close'
  | 'dress'
  | 'edit'
  | 'eye'
  | 'grid'
  | 'heart'
  | 'home'
  | 'info'
  | 'instagram'
  | 'layers'
  | 'menu'
  | 'package'
  | 'plus'
  | 'refresh'
  | 'rotate'
  | 'search'
  | 'send'
  | 'settings'
  | 'shirt'
  | 'sparkles'
  | 'tag'
  | 'truck'
  | 'user'
  | 'users'
  | 'warehouse'
  | 'warning';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const iconPaths: Record<IconName, ReactNode> = {
  'arrow-left': <path d="m9 5 7 7-7 7" />,
  'arrow-right': <path d="m15 5-7 7 7 7" />,
  bag: (
    <>
      <path d="M5 8.5h14l-1 11H6l-1-11Z" />
      <path d="M8.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" />
      <path d="M10 21h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M7 3v4M17 3v4M3.5 9h17" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  dress: (
    <>
      <path d="M9 4.5a3 3 0 0 0 6 0" />
      <path d="m9 6-2 4 2 1-3 8h8l-3-8 2-1-2-4" />
      <path d="m15 6 2 4-2 1 3 8h-8" />
    </>
  ),
  edit: (
    <>
      <path d="m4 16.5-.7 4.2 4.2-.7L19 8.5 15.5 5 4 16.5Z" />
      <path d="m13.5 7 3.5 3.5M4 20.5l3.5-3.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  heart: <path d="M20.8 8.8c0 5.2-8.8 10.4-8.8 10.4S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.3Z" />,
  home: (
    <>
      <path d="m3.5 10.5 8.5-7 8.5 7" />
      <path d="M5.5 9.5v10h13v-10M9 19.5v-5h6v5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5v5M12 7.5h.01" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  package: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 7.8 7.5 4.2 7.5-4.2M12 12v9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-13.6-5.7L4 7.5" />
      <path d="M4 4v3.5h3.5M4 13a8 8 0 0 0 13.6 5.7l2.4-2.2" />
      <path d="M20 20v-3.5h-3.5" />
    </>
  ),
  rotate: (
    <>
      <path d="M4 12a8 8 0 0 1 13.6-5.7L20 8.5" />
      <path d="M20 5v3.5h-3.5M20 12a8 8 0 0 1-13.6 5.7L4 15.5" />
      <path d="M4 19v-3.5h3.5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  send: <path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  shirt: (
    <>
      <path d="m8 5 4 2 4-2 4 3-2.5 4-2-1v9h-7v-9l-2 1L4 8l4-3Z" />
      <path d="M10 6.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  sparkles: (
    <>
      <path d="m8 3 1.2 3.8L13 8l-3.8 1.2L8 13l-1.2-3.8L3 8l3.8-1.2L8 3Z" />
      <path d="m17 12 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM17 3v3M18.5 4.5h-3" />
    </>
  ),
  tag: (
    <>
      <path d="M4 4h7l9 9-7 7-9-9V4Z" />
      <circle cx="8" cy="8" r="1" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7V9Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 4 5" />
    </>
  ),
  warehouse: (
    <>
      <path d="m3 9 9-5 9 5v11H3V9Z" />
      <path d="M7 20v-6h10v6M7 10h.01M12 10h.01M17 10h.01" />
    </>
  ),
  warning: (
    <>
      <path d="m12 3 9 16H3l9-16Z" />
      <path d="M12 9v4M12 16h.01" />
    </>
  ),
};

function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

type Audience = 'women' | 'men' | 'children';

type Product = {
  slug: string;
  name: string;
  audience: Audience;
  category: string;
  price: number;
  compareAt?: number;
  image: string;
  alt: string;
  colors: string[];
  tag?: string;
  stock?: string;
};

type Category = {
  label: string;
  href: string;
  icon: IconName;
};

const products: Product[] = [
  {
    slug: 'linen-overshirt',
    name: 'مانتوی لینن کمربندی آوا',
    audience: 'women',
    category: 'مانتو و رویه',
    price: 2490000,
    compareAt: 2890000,
    image: '/assets/nova-product-linen-overshirt.webp',
    alt: 'مانتوی لینن روشن با کمربند پارچه‌ای',
    colors: ['#e6ddd0', '#a89b8d', '#272220'],
    tag: 'تازه‌وارد',
    stock: 'موجود',
  },
  {
    slug: 'oxford-shirt',
    name: 'پیراهن آکسفورد مردانه',
    audience: 'men',
    category: 'پیراهن مردانه',
    price: 1890000,
    image: '/assets/nova-product-oxford-shirt.webp',
    alt: 'پیراهن آکسفورد آبی روشن',
    colors: ['#b7c7dc', '#263d68'],
    tag: 'پرفروش',
    stock: 'موجود',
  },
  {
    slug: 'kids-knit-set',
    name: 'ست دورس و شلوار کودک',
    audience: 'children',
    category: 'لباس کودک',
    price: 1690000,
    image: '/assets/nova-product-kids-set.webp',
    alt: 'ست دورس سبز زیتونی کودک',
    colors: ['#65705b', '#263026'],
    tag: 'سایزهای کامل',
    stock: 'موجود',
  },
  {
    slug: 'textured-scarf',
    name: 'شال بافت برجسته',
    audience: 'women',
    category: 'اکسسوری',
    price: 890000,
    image: '/assets/nova-product-textured-scarf.webp',
    alt: 'شال بافتنی با رنگ خنثی',
    colors: ['#e7ded2', '#9b8b78'],
    tag: 'اکسسوری',
    stock: 'موجود',
  },
  {
    slug: 'soft-trousers',
    name: 'شلوار نرم و راسته',
    audience: 'women',
    category: 'شلوار',
    price: 1990000,
    image: '/assets/nova-product-soft-trousers.webp',
    alt: 'شلوار پارچه‌ای نرم به رنگ خاکی',
    colors: ['#b1a394', '#292621'],
    stock: 'رو به اتمام',
  },
  {
    slug: 'knit-cardigan',
    name: 'ژاکت بافت یقه‌گرد',
    audience: 'women',
    category: 'بافت',
    price: 2190000,
    image: '/assets/nova-product-knit-cardigan.webp',
    alt: 'ژاکت بافتنی قهوه‌ای روشن',
    colors: ['#817464', '#44382d', '#d7cbbb'],
    tag: 'فصل تازه',
    stock: 'موجود',
  },
];

const categories: Category[] = [
  { label: 'زنانه', href: '#category/women', icon: 'dress' },
  { label: 'مردانه', href: '#category/men', icon: 'shirt' },
  { label: 'بچگانه', href: '#category/children', icon: 'users' },
  { label: 'اکسسوری', href: '#products/accessories', icon: 'bag' },
  { label: 'تازه‌ها', href: '#products/new', icon: 'sparkles' },
  { label: 'کالکشن‌ها', href: '#campaign', icon: 'book' },
  { label: 'تخفیف', href: '#products/sale', icon: 'tag' },
];

const navItems = [
  { label: 'زنانه', href: '#category/women' },
  { label: 'مردانه', href: '#category/men' },
  { label: 'بچگانه', href: '#category/children' },
  { label: 'اکسسوری', href: '#products/accessories' },
  { label: 'جدیدترین‌ها', href: '#products/new' },
  { label: 'کالکشن‌ها', href: '#campaign' },
  { label: 'تخفیف', href: '#products/sale' },
];

const audienceCopy: Record<Audience, { label: string; title: string; description: string; image: string }> = {
  women: {
    label: 'زنانه',
    title: 'لباس‌هایی برای روزهای روشن',
    description: 'رویه‌های سبک، بافت‌های آرام و جزئیاتی که هر روز را شخصی‌تر می‌کنند.',
    image: '/assets/nova-women-lifestyle.webp',
  },
  men: {
    label: 'مردانه',
    title: 'فرم‌های ساده، حضور ماندگار',
    description: 'ترکیبی از برش دقیق، پارچه‌های خوش‌دست و رنگ‌هایی که به‌راحتی کنار هم می‌نشینند.',
    image: '/assets/nova-hero-men.webp',
  },
  children: {
    label: 'بچگانه',
    title: 'برای بازی‌های تمام‌نشدنی',
    description: 'لباس‌های راحت و مقاوم برای حرکت، کشف و روزهایی که باید آزاد باشند.',
    image: '/assets/nova-children-lifestyle.webp',
  },
};

function formatToman(amount: number) {
  return `${new Intl.NumberFormat('fa-IR').format(amount)} تومان`;
}

function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash || '#home');

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || '#home');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}

function useScrollToTop(route: string) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [route]);
}

function Logo() {
  return (
    <a className="brand-lockup inline-flex w-max flex-col items-center leading-none" href="#home" aria-label="NOVA، صفحه اصلی">
      <span className="brand-lockup__name">NOVA</span>
      <span className="brand-lockup__descriptor">ATELIER EDITORIAL</span>
    </a>
  );
}

type HeaderProps = {
  cartCount: number;
  onMenu: () => void;
  onSearch: () => void;
};

function Header({ cartCount, onMenu, onSearch }: HeaderProps) {
  return (
    <header className="site-header sticky top-0 z-[200] border-b border-border bg-background backdrop-blur">
      <div className="shell site-header__inner mx-auto w-[calc(100%-2rem)] max-w-[1280px]">
        <div className="site-header__nav-wrap flex items-center gap-3.5">
          <button className="icon-button site-header__menu" type="button" onClick={onMenu} aria-label="باز کردن منو">
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
          <a className="cart-button inline-flex min-h-10 items-center gap-2 rounded-editorial bg-primary px-3 text-primary-foreground transition-transform duration-150 hover:-translate-y-px hover:bg-primary-hover" href="#cart" aria-label={`سبد خرید، ${cartCount} کالا`}>
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

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: string;
  href?: string;
};

function SectionHeading({ eyebrow, title, description, action, href = '#products' }: SectionHeadingProps) {
  return (
    <div className="section-heading flex items-end justify-between gap-5">
      <div>
        {eyebrow ? <span className="section-heading__eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? (
        <a className="text-link" href={href}>
          {action}
          <Icon name="arrow-left" size={16} />
        </a>
      ) : null}
    </div>
  );
}

type ProductCardProps = {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (slug: string) => void;
  onAdd: (product: Product) => void;
};

function ProductCard({ product, isWishlisted, onToggleWishlist, onAdd }: ProductCardProps) {
  return (
    <article className="product-card min-w-0">
      <div className="product-card__media relative aspect-square overflow-hidden rounded-editorial bg-secondary">
        <a href={`#product/${product.slug}`} aria-label={`مشاهده ${product.name}`}>
          <img src={product.image} alt={product.alt} loading="lazy" />
        </a>
        <button
          className={`icon-button product-card__favorite ${isWishlisted ? 'is-selected' : ''}`}
          type="button"
          aria-label={isWishlisted ? `حذف ${product.name} از علاقه‌مندی‌ها` : `افزودن ${product.name} به علاقه‌مندی‌ها`}
          aria-pressed={isWishlisted}
          onClick={() => onToggleWishlist(product.slug)}
        >
          <Icon name="heart" size={17} />
        </button>
        {product.tag ? <span className="product-card__tag">{product.tag}</span> : null}
      </div>
      <div className="product-card__body pt-2.5">
        <div className="product-card__meta flex items-center justify-between gap-2">
          <span>{product.category}</span>
          <span className={product.stock === 'رو به اتمام' ? 'is-warning' : ''}>{product.stock}</span>
        </div>
        <a className="product-card__title" href={`#product/${product.slug}`}>
          {product.name}
        </a>
        <div className="product-card__footer flex items-end justify-between gap-2">
          <div className="product-card__price">
            {product.compareAt ? <del>{formatToman(product.compareAt)}</del> : null}
            <strong>{formatToman(product.price)}</strong>
          </div>
          <div className="product-card__purchase flex items-center gap-1.5">
            <div className="color-swatches" aria-label="رنگ‌های موجود">
              {product.colors.map((color) => (
                <span key={color} className="color-swatch" style={{ backgroundColor: color }} />
              ))}
            </div>
            <button className="quick-add inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-150 hover:-translate-y-px hover:bg-primary-hover" type="button" onClick={() => onAdd(product)} aria-label={`افزودن ${product.name} به سبد`}>
              <Icon name="plus" size={17} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

type ProductGridProps = {
  items: Product[];
  isWishlisted: (slug: string) => boolean;
  onToggleWishlist: (slug: string) => void;
  onAdd: (product: Product) => void;
  className?: string;
};

function ProductGrid({ items, className = '', isWishlisted, onToggleWishlist, onAdd }: ProductGridProps) {
  return (
    <div className={`product-grid grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 ${className}`}>
      {items.map((product) => (
        <ProductCard
          key={product.slug}
          product={product}
          isWishlisted={isWishlisted(product.slug)}
          onToggleWishlist={onToggleWishlist}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
}

type HomeProps = Omit<ProductGridProps, 'items' | 'className'>;

function HomePage({ isWishlisted, onToggleWishlist, onAdd }: HomeProps) {
  return (
    <>
      <main className="bg-background">
        <div className="shell home-page mx-auto w-[calc(100%-2rem)] max-w-[1280px]">
          <section className="hero-spread block gap-4 lg:grid lg:grid-cols-[minmax(0,2.05fr)_minmax(250px,0.86fr)]" aria-labelledby="hero-title">
            <article className="hero-story flex flex-col overflow-hidden rounded-editorial border border-border bg-surface lg:grid">
              <div className="hero-story__copy flex flex-col justify-center">
                <span className="folio-mark">۰۱ / پاییز ۱۴۰۵</span>
                <p className="hero-story__kicker">نوا / کالکشن تازه</p>
                <h1 id="hero-title">جزئیات آرام، برای روزهای بلند</h1>
                <p>
                  انتخابی از بافت‌های طبیعی، فرم‌های دقیق و رنگ‌هایی که با فصل همراه می‌شوند.
                </p>
                <a className="editorial-cta" href="#products/new">
                  مشاهده کالکشن
                  <Icon name="arrow-left" size={17} />
                </a>
              </div>
              <a className="hero-story__media relative overflow-hidden" href="#campaign" aria-label="مشاهده کالکشن پاییز">
                <img src="/assets/nova-women-lifestyle.webp" alt="استایل پاییزی زنانه در فضای روشن و آرام" />
                <span className="image-caption">استودیو نوا / ۰۱</span>
              </a>
            </article>

            <div className="hero-support gap-4" aria-label="داستان‌های همراه کالکشن">
              <a className="support-card support-card--portrait" href="#category/men">
                <img src="/assets/nova-hero-men.webp" alt="استایل مردانه با کت چهارخانه در استودیو" />
                <span className="support-card__veil" />
                <span className="support-card__copy">
                  <span className="folio-mark">۰۲</span>
                  <strong>لایه‌هایی برای فصل تغییر</strong>
                  <span>مشاهده مردانه</span>
                </span>
              </a>
              <a className="support-card support-card--material" href="#article">
                <img src="/assets/nova-materials.webp" alt="بافت‌های طبیعی پارچه و نخ در کنار هم" />
                <span className="support-card__veil" />
                <span className="support-card__copy">
                  <span className="folio-mark">۰۳</span>
                  <strong>بافت‌هایی که لمس می‌شوند</strong>
                  <span>یادداشت متریال</span>
                </span>
              </a>
            </div>
          </section>

          <nav className="category-rail gap-2 border-y border-border" aria-label="میانبر دسته‌بندی‌ها">
            {categories.map((category) => (
              <a key={category.href} className="category-rail__item" href={category.href}>
                <span className="category-rail__icon">
                  <Icon name={category.icon} size={24} />
                </span>
                <span>{category.label}</span>
              </a>
            ))}
          </nav>

          <section className="home-section" aria-labelledby="arrivals-title">
            <SectionHeading
              eyebrow="۰۲ / انتخاب‌های تازه"
              title="تازه‌های آتلیه"
              description="قطعاتی که برای پوشیدن امروز، و ماندن در کمد فردا انتخاب شده‌اند."
              action="مشاهده همه"
              href="#products/new"
            />
            <ProductGrid items={products.slice(0, 4)} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} onAdd={onAdd} />
          </section>

          <section className="collection-story border border-border bg-surface lg:grid" aria-labelledby="story-title">
            <div className="collection-story__media">
              <img src="/assets/nova-materials.webp" alt="پارچه‌های طبیعی با رنگ‌های خنثی در استودیو" loading="lazy" />
              <span className="image-caption">جزئیات / متریال</span>
            </div>
            <div className="collection-story__copy">
              <span className="folio-mark">۰۳ / یادداشت آتلیه</span>
              <h2 id="story-title">بافت‌ها، از نزدیک</h2>
              <p>
                ما به جزئیاتی فکر می‌کنیم که دیده نمی‌شوند؛ از انتخاب پارچه‌ای که نرم‌تر می‌شود تا دوختی که با هر بار پوشیدن، دقیق‌تر می‌نشیند.
              </p>
              <a className="text-link" href="#article">
                خواندن داستان پارچه‌ها
                <Icon name="arrow-left" size={16} />
              </a>
            </div>
          </section>

          <section className="home-section" aria-labelledby="bestsellers-title">
            <SectionHeading
              eyebrow="۰۴ / انتخاب‌های ماندگار"
              title="محبوب‌های نوا"
              description="مدل‌هایی که بیشتر از یک فصل با شما همراه می‌شوند."
              action="مشاهده همه"
              href="#products"
            />
            <ProductGrid items={products.slice(2, 6)} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} onAdd={onAdd} />
          </section>

          <TrustStrip />
          <Newsletter />
        </div>
      </main>
      <Footer />
    </>
  );
}

function TrustStrip() {
  const items = [
    { icon: 'truck' as IconName, title: 'ارسال سریع', copy: 'ارسال به سراسر ایران' },
    { icon: 'rotate' as IconName, title: '۷ روز ضمانت بازگشت', copy: 'خریدی مطمئن و بدون نگرانی' },
    { icon: 'users' as IconName, title: 'پشتیبانی', copy: 'پاسخ‌گوی سوال‌های شما هستیم' },
  ];

  return (
    <section className="trust-strip border-y border-border" aria-label="خدمات نوا">
      {items.map((item) => (
        <div className="trust-strip__item" key={item.title}>
          <Icon name={item.icon} size={26} />
          <div>
            <strong>{item.title}</strong>
            <span>{item.copy}</span>
          </div>
        </div>
      ))}
    </section>
  );
}

function Newsletter() {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="newsletter bg-secondary lg:grid" aria-labelledby="newsletter-title">
      <div className="newsletter__image">
        <img src="/assets/nova-materials.webp" alt="گلدان و کتاب در فضای آرام آتلیه" loading="lazy" />
      </div>
      <div className="newsletter__copy">
        <span className="section-heading__eyebrow">دفترچه آتلیه نوا</span>
        <h2 id="newsletter-title">خبرنامه آتلیه نوا</h2>
        <p>اولین نفری باشید که از کالکشن‌های جدید، یادداشت‌های متریال و پیشنهادهای اختصاصی ما باخبر می‌شوید.</p>
        {submitted ? (
          <div className="inline-message inline-message--success" role="status">
            <Icon name="check" size={16} />
            ایمیل شما ثبت شد؛ به‌زودی از نوا می‌شنوید.
          </div>
        ) : (
          <form
            className="newsletter__form"
            onSubmit={(event) => {
              event.preventDefault();
              if (value.trim()) setSubmitted(true);
            }}
          >
            <label className="sr-only" htmlFor="newsletter-email">
              ایمیل شما
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="ایمیل خود را وارد کنید"
              required
              dir="ltr"
            />
            <Button type="submit" size="sm">
              عضویت
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer border-t border-border bg-surface">
      <div className="shell site-footer__grid mx-auto w-[calc(100%-2rem)] max-w-[1280px] grid gap-7">
        <div className="site-footer__brand">
          <Logo />
          <p>نوا، انتخابی برای پوشیدن، زندگی کردن و ماندن.</p>
          <div className="footer-socials">
            <a className="icon-button" href="#contact" aria-label="اینستاگرام نوا">
              <Icon name="instagram" size={17} />
            </a>
            <a className="icon-button" href="#contact" aria-label="تماس با نوا">
              <Icon name="send" size={17} />
            </a>
          </div>
        </div>
        <div>
          <h3>درباره نوا</h3>
          <a href="#about">درباره ما</a>
          <a href="#article">آتلیه</a>
          <a href="#trust">اعتماد و اصالت</a>
          <a href="#contact">تماس با ما</a>
        </div>
        <div>
          <h3>راهنمای خرید</h3>
          <a href="#guide">راهنمای انتخاب</a>
          <a href="#size-guide">راهنمای اندازه</a>
          <a href="#shipping-policy">ارسال و تحویل</a>
          <a href="#returns-policy">بازگشت کالا</a>
        </div>
        <div>
          <h3>فروشگاه</h3>
          <a href="#category/women">زنانه</a>
          <a href="#category/men">مردانه</a>
          <a href="#category/children">بچگانه</a>
          <a href="#products/accessories">اکسسوری</a>
        </div>
      </div>
      <div className="shell site-footer__bottom">
        <span>تمامی حقوق برای نوا محفوظ است.</span>
        <span dir="ltr">NOVA / 1405</span>
      </div>
    </footer>
  );
}

type ListingProps = HomeProps & {
  audience?: Audience;
  mode?: string;
};

function CategoryPage({ audience, isWishlisted, onToggleWishlist, onAdd }: ListingProps) {
  const currentAudience = audience ?? 'women';
  const copy = audienceCopy[currentAudience];
  const items = products.filter((product) => product.audience === currentAudience);

  return (
    <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb"><a href="#home">خانه</a><span>/</span><span>{copy.label}</span></div>
      <section className="category-hero">
        <img src={copy.image} alt={`تصویر ادیتوریال دسته ${copy.label}`} />
        <div className="category-hero__copy">
          <span className="folio-mark">کالکشن / {copy.label}</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
          <a className="editorial-cta" href={`#products/${currentAudience}`}>
            مشاهده محصولات
            <Icon name="arrow-left" size={17} />
          </a>
        </div>
      </section>
      <section className="subcategories" aria-label={`زیر دسته‌های ${copy.label}`}>
        {['تازه‌ها', 'پرفروش‌ها', 'بافت و رویه', 'شلوار', 'راهنمای اندازه'].map((item) => (
          <a href={item === 'راهنمای اندازه' ? '#size-guide' : `#products/${currentAudience}`} key={item}>
            <span>{item}</span>
            <Icon name="arrow-left" size={16} />
          </a>
        ))}
      </section>
      <section className="home-section">
        <SectionHeading title={`انتخاب‌های محبوب ${copy.label}`} action="مشاهده همه" href={`#products/${currentAudience}`} />
        <ProductGrid items={items.length ? items : products.slice(0, 4)} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} onAdd={onAdd} />
      </section>
      <section className="guide-callout">
        <div>
          <span className="section-heading__eyebrow">راهنمای انتخاب</span>
          <h2>سایز درست، حس درست</h2>
          <p>برای هر مدل، اندازه‌گیری و پیشنهاد فیت را کنار مشخصات محصول گذاشته‌ایم تا با خیال راحت انتخاب کنید.</p>
        </div>
        <a className="text-link" href="#size-guide">مشاهده راهنمای اندازه <Icon name="arrow-left" size={16} /></a>
      </section>
    </main>
  );
}

function ProductsPage({ audience, mode, isWishlisted, onToggleWishlist, onAdd }: ListingProps) {
  const [filter, setFilter] = useState('همه');
  const filters = ['همه', 'پیراهن', 'رویه', 'بافت', 'اکسسوری'];
  const filtered = useMemo(() => {
    let result = audience ? products.filter((product) => product.audience === audience) : products;
    if (mode === 'accessories') result = result.filter((product) => product.category === 'اکسسوری');
    if (mode === 'sale') result = result.filter((product) => product.compareAt);
    if (filter !== 'همه') result = result.filter((product) => product.category.includes(filter));
    return result;
  }, [audience, filter, mode]);
  const title = mode === 'sale' ? 'تخفیف‌های منتخب' : mode === 'new' ? 'تازه‌های آتلیه' : audience ? `محصولات ${audienceCopy[audience].label}` : 'همه محصولات';

  return (
    <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb"><a href="#home">خانه</a><span>/</span><span>فروشگاه</span></div>
      <header className="listing-header">
        <div>
          <span className="section-heading__eyebrow">NOVA / CATALOG</span>
          <h1>{title}</h1>
          <p>{filtered.length} مدل برای انتخاب شما</p>
        </div>
        <button className="sort-control" type="button">
          جدیدترین
          <Icon name="chevron-down" size={16} />
        </button>
      </header>
      <div className="listing-layout lg:grid">
        <aside className="filter-rail" aria-label="فیلتر محصولات">
          <div className="filter-rail__heading"><strong>فیلترها</strong><button type="button" onClick={() => setFilter('همه')}>حذف همه</button></div>
          <div className="filter-group">
            <span>دسته‌بندی</span>
            {filters.map((item) => <button className={filter === item ? 'is-active' : ''} type="button" key={item} onClick={() => setFilter(item)}>{item}<span>{item === 'همه' ? products.length : ''}</span></button>)}
          </div>
          <div className="filter-group filter-group--compact"><span>اندازه</span><button type="button">مشاهده اندازه‌ها <Icon name="chevron-down" size={15} /></button></div>
          <div className="filter-group filter-group--compact"><span>رنگ</span><button type="button">انتخاب رنگ <Icon name="chevron-down" size={15} /></button></div>
        </aside>
        <div className="listing-content">
          <div className="mobile-filter-bar"><button type="button"><Icon name="layers" size={17} /> فیلتر</button><button type="button"><Icon name="grid" size={17} /> نمایش</button></div>
          {filtered.length ? <ProductGrid items={filtered} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} onAdd={onAdd} /> : <EmptyState title="محصولی در این محدوده پیدا نشد" action="حذف فیلترها" onAction={() => setFilter('همه')} />}
        </div>
      </div>
    </main>
  );
}

function ProductPage({ slug, isWishlisted, onToggleWishlist, onAdd }: HomeProps & { slug: string }) {
  const product = products.find((item) => item.slug === slug);
  const [size, setSize] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  if (!product) return <NotFoundPage />;
  const wishlisted = isWishlisted(product.slug);

  return (
    <main className="shell inner-page product-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb"><a href="#home">خانه</a><span>/</span><a href={`#products/${product.audience}`}>{audienceCopy[product.audience].label}</a><span>/</span><span>{product.name}</span></div>
      <div className="product-detail lg:grid">
        <div className="product-detail__gallery">
          <div className="product-detail__main-image"><img src={product.image} alt={product.alt} /></div>
          <div className="product-detail__thumbs"><button className="is-active" type="button"><img src={product.image} alt="" /></button><button type="button"><img src={product.image} alt="" /></button></div>
        </div>
        <section className="product-detail__info" aria-labelledby="product-title">
          <div className="product-detail__eyebrow"><span>{product.category}</span><button type="button" className={wishlisted ? 'is-selected' : ''} onClick={() => onToggleWishlist(product.slug)} aria-label="افزودن به علاقه‌مندی‌ها" aria-pressed={wishlisted}><Icon name="heart" size={19} /></button></div>
          <h1 id="product-title">{product.name}</h1>
          <div className="product-detail__price">{product.compareAt ? <del>{formatToman(product.compareAt)}</del> : null}<strong>{formatToman(product.price)}</strong></div>
          <p className="product-detail__description">رویه‌ای سبک با فرم آزاد و بند قابل تنظیم؛ برای لایه‌سازی روزهای خنک و استایل‌های آرام طراحی شده است.</p>
          <div className="product-detail__meta"><span><Icon name="check" size={15} /> {product.stock}</span><span><Icon name="truck" size={15} /> ارسال ۲ تا ۴ روز کاری</span></div>
          <fieldset className="size-picker">
            <legend>انتخاب اندازه <a href="#size-guide">راهنمای اندازه</a></legend>
            <div className="size-picker__options">{['S', 'M', 'L', 'XL'].map((item) => <button className={size === item ? 'is-active' : ''} type="button" key={item} onClick={() => setSize(item)}>{item}</button>)}</div>
            {!size ? <p className="field-hint">لطفاً اندازه را انتخاب کنید.</p> : null}
          </fieldset>
          <Button className="product-detail__add" size="lg" type="button" onClick={() => size && onAdd(product)} disabled={!size}>
            <Icon name="bag" size={18} /> افزودن به سبد خرید
          </Button>
          <div className="detail-accordions"><button type="button" onClick={() => setShowDetails(!showDetails)}><span>جزئیات و مراقبت</span><Icon name="chevron-down" size={17} /></button>{showDetails ? <p>ترکیب پارچه، جدول اندازه، روش شست‌وشو و پیشنهاد فیت در این بخش قرار می‌گیرد.</p> : null}<button type="button"><span>ارسال و بازگشت</span><Icon name="chevron-down" size={17} /></button></div>
        </section>
      </div>
      <section className="home-section product-related"><SectionHeading title="شاید این‌ها را هم بپسندید" action="مشاهده همه" href="#products" /><ProductGrid items={products.filter((item) => item.slug !== product.slug).slice(0, 4)} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} onAdd={onAdd} /></section>
    </main>
  );
}

function CartPage({ cartCount, onAdd, isWishlisted, onToggleWishlist }: HomeProps & { cartCount: number }) {
  const item = products[0];
  if (!cartCount || !item) {
    return <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background"><EmptyState title="سبد خرید شما هنوز خالی است" description="از میان انتخاب‌های آتلیه، قطعه‌ای برای روزهای پیش رو پیدا کنید." action="مشاهده تازه‌ها" href="#products/new" /></main>;
  }
  return (
    <main className="shell inner-page cart-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb"><a href="#home">خانه</a><span>/</span><span>سبد خرید</span></div>
      <header className="simple-page-header"><span className="section-heading__eyebrow">NOVA / CART</span><h1>سبد خرید</h1><p>{cartCount} کالا در سبد شماست.</p></header>
      <div className="cart-layout lg:grid">
        <section className="cart-items"><article className="cart-line"><img src={item.image} alt={item.alt} /><div><span className="section-heading__eyebrow">{item.category}</span><h2>{item.name}</h2><p>اندازه: M · رنگ: شیری</p><strong>{formatToman(item.price)}</strong></div><button className="icon-button" type="button" aria-label="حذف کالا"><Icon name="close" size={17} /></button></article><div className="inline-message inline-message--warning"><Icon name="info" size={16} /> قیمت و موجودی در مرحله پرداخت دوباره بررسی می‌شود.</div></section>
        <aside className="summary-card"><h2>خلاصه سفارش</h2><div><span>جمع کالاها</span><strong>{formatToman(item.price * cartCount)}</strong></div><div><span>ارسال</span><strong>پس از انتخاب آدرس</strong></div><div className="summary-card__total"><span>مبلغ قابل پرداخت</span><strong>{formatToman(item.price * cartCount)}</strong></div><Button asChild size="lg"><a href="#checkout/address">ادامه فرایند خرید <Icon name="arrow-left" size={17} /></a></Button><a className="text-link text-link--center" href="#products">ادامه خرید</a></aside>
      </div>
      <section className="home-section"><SectionHeading title="پیشنهادهای همراه" /><ProductGrid items={products.slice(1, 5)} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} onAdd={onAdd} /></section>
    </main>
  );
}

function CheckoutPage({ step, cartCount }: { step: string; cartCount: number }) {
  const steps = [
    { key: 'address', label: 'آدرس', href: '#checkout/address' },
    { key: 'shipping', label: 'ارسال', href: '#checkout/shipping' },
    { key: 'payment', label: 'پرداخت', href: '#checkout/payment' },
  ];
  const currentIndex = Math.max(0, steps.findIndex((item) => item.key === step));
  const nextHref = steps[currentIndex + 1]?.href ?? '#checkout/confirmation';
  const firstProductPrice = products[0]?.price ?? 0;
  const pageTitle = step === 'address' ? 'آدرس تحویل' : step === 'shipping' ? 'روش ارسال' : 'پرداخت امن';
  return (
    <main className="shell inner-page checkout-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb"><a href="#cart">سبد خرید</a><span>/</span><span>تکمیل سفارش</span></div>
      <div className="checkout-layout lg:grid">
        <section className="checkout-main"><div className="checkout-stepper" aria-label="مراحل تکمیل سفارش">{steps.map((item, index) => <a className={index <= currentIndex ? 'is-active' : ''} href={item.href} key={item.key}><span>{index + 1}</span>{item.label}</a>)}</div><header className="simple-page-header"><span className="section-heading__eyebrow">مرحله {currentIndex + 1} از ۳</span><h1>{pageTitle}</h1><p>اطلاعات شما فقط برای تکمیل همین سفارش استفاده می‌شود.</p></header>{step === 'address' ? <AddressForm /> : step === 'shipping' ? <ShippingOptions /> : <PaymentOptions />}<Button className="checkout-next" size="lg" type="button" asChild><a href={nextHref}>{step === 'payment' ? 'پرداخت و ثبت سفارش' : 'ادامه'} <Icon name="arrow-left" size={17} /></a></Button></section>
        <aside className="summary-card checkout-summary"><span className="section-heading__eyebrow">خلاصه سفارش</span><h2>{cartCount ? 'مانتوی لینن کمربندی آوا' : 'سبد خرید خالی'}</h2><div><span>مبلغ کالاها</span><strong>{formatToman(cartCount ? firstProductPrice * cartCount : 0)}</strong></div><div><span>ارسال</span><strong>رایگان</strong></div><div className="summary-card__total"><span>مبلغ نهایی</span><strong>{formatToman(cartCount ? firstProductPrice * cartCount : 0)}</strong></div><a className="text-link" href="#cart">ویرایش سبد <Icon name="arrow-left" size={15} /></a></aside>
      </div>
    </main>
  );
}

function AddressForm() {
  return <div className="form-card"><label>نام و نام خانوادگی<input type="text" placeholder="مثلاً سارا احمدی" /></label><label>شماره تماس<input type="tel" dir="ltr" placeholder="۰۹۱۲ ۱۲۳ ۴۵۶۷" /></label><label>نشانی کامل<textarea rows={3} placeholder="استان، شهر، خیابان، پلاک و واحد" /></label><div className="form-row"><label>کد پستی<input type="text" dir="ltr" placeholder="۱۰ رقمی" /></label><label>استان<select defaultValue="تهران"><option>تهران</option><option>اصفهان</option><option>خراسان رضوی</option></select></label></div></div>;
}

function ShippingOptions() {
  return <div className="option-list"><label className="option-card is-selected"><input type="radio" name="shipping" defaultChecked /><span><strong>ارسال عادی</strong><small>تحویل بین ۲ تا ۴ روز کاری · سراسر ایران</small></span><b>رایگان</b></label><label className="option-card"><input type="radio" name="shipping" /><span><strong>ارسال سریع</strong><small>تحویل ۱ تا ۲ روز کاری · شهرهای منتخب</small></span><b>۸۹٬۰۰۰ تومان</b></label></div>;
}

function PaymentOptions() {
  return <div className="option-list"><label className="option-card is-selected"><input type="radio" name="payment" defaultChecked /><span><strong>پرداخت آنلاین</strong><small>پرداخت امن از طریق درگاه بانکی</small></span><Icon name="check" size={18} /></label><div className="inline-message inline-message--info"><Icon name="info" size={16} /> پس از بازگشت از درگاه، وضعیت پرداخت توسط سرور بررسی می‌شود.</div></div>;
}

function ConfirmationPage() {
  return <main className="shell inner-page confirmation-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background"><section className="confirmation-card"><span className="confirmation-card__icon"><Icon name="check" size={28} /></span><span className="section-heading__eyebrow">NOVA / ORDER CONFIRMED</span><h1>سفارش شما ثبت شد</h1><p>ممنون که نوا را برای روزهای خود انتخاب کردید. جزئیات سفارش به شماره تماس شما ارسال می‌شود.</p><strong className="ltr-value" dir="ltr">NV-1405-2481</strong><div className="confirmation-card__actions"><Button asChild size="lg"><a href="#order/NV-1405-2481">پیگیری سفارش</a></Button><a className="text-link" href="#home">بازگشت به خانه <Icon name="arrow-left" size={16} /></a></div></section></main>;
}

function AccountPage({ section = 'dashboard' }: { section?: string }) {
  const titles: Record<string, string> = { dashboard: 'حساب کاربری', profile: 'اطلاعات شخصی', addresses: 'آدرس‌ها', orders: 'سفارش‌های من', support: 'پشتیبانی', security: 'امنیت حساب', notifications: 'اعلان‌ها' };
  const title = titles[section] ?? titles.dashboard;
  return <main className="shell inner-page account-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background"><div className="breadcrumb"><a href="#home">خانه</a><span>/</span><span>حساب کاربری</span></div><div className="account-layout lg:grid"><aside className="account-nav"><div className="account-nav__profile"><span>س</span><div><strong>سارا احمدی</strong><small dir="ltr">۰۹۱۲ ۱۲۳ ۴۵۶۷</small></div></div>{Object.entries({ dashboard: 'نمای کلی', orders: 'سفارش‌های من', addresses: 'آدرس‌ها', profile: 'اطلاعات شخصی', support: 'پشتیبانی', security: 'امنیت حساب', notifications: 'اعلان‌ها' }).map(([key, label]) => <a className={section === key ? 'is-active' : ''} href={`#account${key === 'dashboard' ? '' : `/${key}`}`} key={key}><Icon name={key === 'orders' ? 'package' : key === 'addresses' ? 'home' : key === 'security' ? 'settings' : key === 'notifications' ? 'bell' : key === 'support' ? 'send' : key === 'profile' ? 'user' : 'grid'} size={17} />{label}</a>)}</aside><section className="account-content"><header className="simple-page-header"><span className="section-heading__eyebrow">MY NOVA / ۰۱</span><h1>{title}</h1><p>اطلاعات و سفارش‌های شما در یک نگاه.</p></header>{section === 'orders' ? <div className="account-order-list"><a className="order-card" href="#order/NV-1405-2481"><div><span dir="ltr">NV-1405-2481</span><small>۲۴ شهریور ۱۴۰۵ · ۲ کالا</small></div><strong>در حال آماده‌سازی</strong><Icon name="arrow-left" size={17} /></a><a className="order-card" href="#order/NV-1405-2394"><div><span dir="ltr">NV-1405-2394</span><small>۰۸ شهریور ۱۴۰۵ · ۱ کالا</small></div><strong>تحویل شده</strong><Icon name="arrow-left" size={17} /></a></div> : <div className="account-panels md:grid-cols-2"><div className="account-panel"><span className="section-heading__eyebrow">آخرین سفارش</span><h2>سفارش <span dir="ltr">NV-1405-2481</span></h2><p>در حال آماده‌سازی · تحویل تقریبی ۲۸ شهریور</p><a className="text-link" href="#order/NV-1405-2481">مشاهده جزئیات <Icon name="arrow-left" size={15} /></a></div><div className="account-panel"><span className="section-heading__eyebrow">دسترسی سریع</span><a href="#account/addresses">مدیریت آدرس‌ها <Icon name="arrow-left" size={15} /></a><a href="#support">پرسش‌های متداول <Icon name="arrow-left" size={15} /></a><a href="#size-guide">راهنمای اندازه <Icon name="arrow-left" size={15} /></a></div></div>}</section></div></main>;
}

function OrderPage() {
  const events = [{ title: 'سفارش ثبت شد', copy: '۲۴ شهریور ۱۴۰۵ · ۱۰:۲۴', done: true }, { title: 'پرداخت تأیید شد', copy: '۲۴ شهریور ۱۴۰۵ · ۱۰:۲۵', done: true }, { title: 'در حال آماده‌سازی', copy: 'مرکز پردازش نوا', done: true }, { title: 'تحویل به پست', copy: 'به‌زودی به‌روزرسانی می‌شود', done: false }];
  return <main className="shell inner-page order-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background"><div className="breadcrumb"><a href="#account/orders">سفارش‌ها</a><span>/</span><span dir="ltr">NV-1405-2481</span></div><header className="simple-page-header"><span className="section-heading__eyebrow">ORDER / <span dir="ltr">NV-1405-2481</span></span><h1>پیگیری سفارش</h1><p>آخرین وضعیت سفارش شما در این صفحه به‌روزرسانی می‌شود.</p></header><div className="order-layout lg:grid"><section className="timeline-card"><h2>مسیر سفارش</h2>{events.map((event) => <div className={`timeline-event ${event.done ? 'is-done' : ''}`} key={event.title}><span className="timeline-event__dot"><Icon name={event.done ? 'check' : 'package'} size={14} /></span><div><strong>{event.title}</strong><small>{event.copy}</small></div></div>)}</section><aside className="summary-card"><span className="section-heading__eyebrow">تحویل به</span><h2>سارا احمدی</h2><p>تهران، خیابان ولیعصر، کوچه نوا، پلاک ۲۴</p><div className="summary-card__total"><span>مبلغ سفارش</span><strong>{formatToman(2490000)}</strong></div><a className="text-link" href="#support">نیاز به کمک دارید؟ <Icon name="arrow-left" size={15} /></a></aside></div></main>;
}

function EditorialPage({ page }: { page: string }) {
  const content: Record<string, { eyebrow: string; title: string; description: string; image: string }> = {
    campaign: { eyebrow: 'COLLECTION / ۰۱', title: 'فصلِ جزئیات آرام', description: 'روایت پاییز نوا از پارچه‌های طبیعی، فرم‌های ساده و لباس‌هایی که با زندگی روزمره همراه می‌شوند.', image: '/assets/nova-women-lifestyle.webp' },
    guide: { eyebrow: 'NOVA / GUIDE', title: 'راهنمای انتخاب لباس', description: 'از اندازه‌گیری تا انتخاب فیت؛ چند نکته ساده برای خریدی که بیشتر با شما بماند.', image: '/assets/nova-materials.webp' },
    article: { eyebrow: 'ATELIER NOTES / ۰۲', title: 'چرا متریال مهم است؟', description: 'وقتی پارچه را بهتر می‌شناسیم، لباس را هم بهتر انتخاب می‌کنیم. یادداشتی از آتلیه نوا.', image: '/assets/nova-materials.webp' },
    lookbook: { eyebrow: 'LOOKBOOK / ۰۳', title: 'چند لایه برای یک روز', description: 'چهار ترکیب ساده برای روزهایی که هوا بین دو فصل ایستاده است.', image: '/assets/nova-hero-men.webp' },
    about: { eyebrow: 'ABOUT NOVA', title: 'لباس، با فکرِ روزمره', description: 'نوا یک فروشگاه پوشاک ایرانی است؛ برای انتخاب‌هایی که ساده شروع می‌شوند و مدت‌ها ادامه دارند.', image: '/assets/nova-women-lifestyle.webp' },
    trust: { eyebrow: 'NOVA / TRUST', title: 'اعتماد، بخشی از طراحی است', description: 'اطلاعات روشن، پشتیبانی انسانی و فرایندی که از انتخاب تا تحویل کنار شما می‌ماند.', image: '/assets/nova-materials.webp' },
  };
  const data = content[page] ?? content.article;
  if (!data) return <NotFoundPage />;
  return <main className="shell inner-page editorial-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background"><div className="breadcrumb"><a href="#home">خانه</a><span>/</span><span>{data.title}</span></div><section className="editorial-hero lg:grid"><img src={data.image} alt="" /><div><span className="folio-mark">{data.eyebrow}</span><h1>{data.title}</h1><p>{data.description}</p></div></section><article className="reading-column"><p>ما در نوا به لباس به‌عنوان بخشی از زندگی نگاه می‌کنیم؛ چیزی که باید با بدن، زمان و روزهای واقعی شما هماهنگ باشد.</p><h2>سادگی، وقتی دقیق باشد</h2><p>انتخاب پارچه، برش، رنگ و حتی بسته‌بندی، کنار هم تجربه‌ای می‌سازند که قرار نیست شلوغ باشد. این صفحه یک پیش‌نمایش از محتوای تحریریه و راهنمای خرید نواست.</p><div className="reading-note"><Icon name="sparkles" size={21} /><span>این بخش برای محتوای واقعی، قابل ویرایش و آماده اتصال به API محتواست.</span></div></article><section className="home-section"><SectionHeading title="قطعات مرتبط" action="رفتن به فروشگاه" href="#products" /><ProductGrid items={products.slice(0, 4)} isWishlisted={() => false} onToggleWishlist={() => undefined} onAdd={() => undefined} /></section></main>;
}

function AdminPage({ page }: { page: string }) {
  const titleMap: Record<string, string> = { admin: 'نمای کلی', products: 'محصولات', categories: 'دسته‌بندی‌ها', inventory: 'موجودی', orders: 'سفارش‌ها', payments: 'پرداخت‌ها', promotions: 'کدهای تخفیف', customers: 'مشتری‌ها', content: 'محتوا', audit: 'گزارش فعالیت', operations: 'عملیات', login: 'ورود مدیر', 'products/new': 'محصول جدید', 'products/linen-overshirt/edit': 'ویرایش محصول', 'products/linen-overshirt/variants': 'تنوع‌ها', 'products/linen-overshirt/media': 'رسانه محصول', 'orders/NV-1405-2481': 'جزئیات سفارش' };
  const title = titleMap[page] ?? 'پنل مدیریت';
  const nav = [['admin', 'نمای کلی', 'grid'], ['products', 'محصولات', 'shirt'], ['categories', 'دسته‌بندی‌ها', 'layers'], ['inventory', 'موجودی', 'warehouse'], ['orders', 'سفارش‌ها', 'package'], ['payments', 'پرداخت‌ها', 'tag'], ['customers', 'مشتری‌ها', 'users'], ['content', 'محتوا', 'book'], ['audit', 'گزارش فعالیت', 'eye']].map(([key, label, icon]) => ({ key, label, icon: icon as IconName }));
  return <main className="admin-shell"><aside className="admin-sidebar"><Logo /><span className="admin-sidebar__label">فضای مدیریت</span>{nav.map((item) => <a className={page === item.key ? 'is-active' : ''} href={`#admin${item.key === 'admin' ? '' : `/${item.key}`}`} key={item.key}><Icon name={item.icon} size={18} />{item.label}</a>)}<a className="admin-sidebar__logout" href="#home"><Icon name="arrow-right" size={17} />بازگشت به فروشگاه</a></aside><section className="admin-content"><header className="admin-topbar"><button className="icon-button" type="button" aria-label="اعلان‌ها"><Icon name="bell" size={19} /></button><div><span>سلام، مدیر نوا</span><small>آخرین ورود: امروز ۱۰:۲۴</small></div></header><div className="admin-page"><div className="admin-page__heading"><div><span className="section-heading__eyebrow">NOVA / ADMIN</span><h1>{title}</h1></div><div className="admin-page__actions"><button className="admin-secondary" type="button"><Icon name="settings" size={16} />تنظیمات</button>{page === 'products' ? <Button asChild><a href="#admin/products/new"><Icon name="plus" size={17} />محصول جدید</a></Button> : null}</div></div><div className="admin-stat-grid"><div><span>سفارش‌های امروز</span><strong>۲۴</strong><small className="stat-up">+۱۲٪ نسبت به دیروز</small></div><div><span>در انتظار بررسی</span><strong>۸</strong><small>۳ پرداخت نیازمند توجه</small></div><div><span>موجودی کم</span><strong>۶</strong><small className="stat-warning">نیازمند اقدام</small></div><div><span>فروش این ماه</span><strong>۲۴۹٬۸۰۰٬۰۰۰</strong><small>تومان</small></div></div><div className="admin-panels"><section className="admin-panel admin-panel--wide"><div className="admin-panel__heading"><h2>{page === 'orders' ? 'صف سفارش‌ها' : page === 'products' ? 'محصولات اخیر' : 'کارهای نیازمند اقدام'}</h2><a className="text-link" href="#admin/orders">مشاهده همه <Icon name="arrow-left" size={15} /></a></div>{[['NV-1405-2481', 'مانتوی لینن کمربندی آوا', 'در حال آماده‌سازی'], ['NV-1405-2478', 'پیراهن آکسفورد مردانه', 'پرداخت تأیید شد'], ['NV-1405-2472', 'ست دورس و شلوار کودک', 'در انتظار پرداخت']].map(([id, name, status]) => <div className="admin-row" key={id}><span dir="ltr">{id}</span><strong>{name}</strong><span className="status-badge">{status}</span><button className="icon-button" type="button" aria-label={`مشاهده ${id}`}><Icon name="arrow-left" size={16} /></button></div>)}</section><section className="admin-panel"><div className="admin-panel__heading"><h2>سلامت عملیات</h2><Icon name="check" size={18} /></div>{['پرداخت آنلاین', 'ارسال سفارش‌ها', 'رسانه‌ها', 'اعلان‌ها'].map((item) => <div className="health-row" key={item}><span className="health-dot" />{item}<strong>فعال</strong></div>)}</section></div></div></section></main>;
}

function EmptyState({ title, description, action, href, onAction }: { title: string; description?: string; action: string; href?: string; onAction?: () => void }) {
  return <section className="empty-state"><span className="empty-state__icon"><Icon name="layers" size={25} /></span><h1>{title}</h1>{description ? <p>{description}</p> : null}{onAction ? <Button type="button" onClick={onAction}>{action}</Button> : <Button asChild><a href={href ?? '#home'}>{action}</a></Button>}</section>;
}

function NotFoundPage() {
  return <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background"><EmptyState title="این صفحه پیدا نشد" description="به نظر می‌رسد مسیر تغییر کرده است؛ از خانه دوباره شروع کنید." action="بازگشت به خانه" href="#home" /></main>;
}

function MobileBottomNav({ cartCount }: { cartCount: number }) {
  return <nav className="mobile-bottom-nav" aria-label="ناوبری سریع"><a href="#home"><Icon name="home" size={20} /><span>خانه</span></a><a href="#products"><Icon name="grid" size={20} /><span>فروشگاه</span></a><a href="#search"><Icon name="search" size={20} /><span>جست‌وجو</span></a><a href="#cart"><span className="mobile-bottom-nav__bag"><Icon name="bag" size={20} />{cartCount ? <b>{cartCount}</b> : null}</span><span>سبد</span></a><a href="#account"><Icon name="user" size={20} /><span>حساب</span></a></nav>;
}

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  if (!open) return null;
  const matches = query.trim() ? products.filter((product) => product.name.includes(query.trim()) || product.category.includes(query.trim())) : products.slice(0, 3);
  return <div className="modal-layer fixed inset-0 z-[500] flex items-start justify-center" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="search-dialog w-full max-w-3xl bg-surface shadow-float" role="dialog" aria-modal="true" aria-labelledby="search-title" onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}><div className="search-dialog__top"><div><span className="section-heading__eyebrow">NOVA / SEARCH</span><h2 id="search-title">چه چیزی پیدا می‌کنید؟</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="بستن جست‌وجو"><Icon name="close" /></button></div><label className="search-field"><Icon name="search" size={19} /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جست‌وجوی محصول، دسته یا کالکشن" /></label><div className="search-dialog__results"><span className="section-heading__eyebrow">{query ? 'نتایج جست‌وجو' : 'پیشنهادهای نوا'}</span>{matches.length ? matches.map((product) => <a href={`#product/${product.slug}`} key={product.slug} onClick={onClose}><img src={product.image} alt="" /><span><strong>{product.name}</strong><small>{formatToman(product.price)}</small></span><Icon name="arrow-left" size={16} /></a>) : <p className="search-empty">نتیجه‌ای پیدا نشد؛ عبارت دیگری را امتحان کنید.</p>}</div></section></div>;
}

function MenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => { if (!open) return; const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown); }, [onClose, open]);
  if (!open) return null;
  return <div className="modal-layer modal-layer--drawer fixed inset-0 z-[500] flex items-start" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="menu-drawer h-full max-w-[380px] w-[min(86vw,380px)] bg-surface shadow-float" role="dialog" aria-modal="true" aria-label="منوی فروشگاه"><div className="menu-drawer__top"><Logo /><button className="icon-button" type="button" onClick={onClose} aria-label="بستن منو"><Icon name="close" /></button></div><nav>{navItems.map((item) => <a href={item.href} key={item.href} onClick={onClose}>{item.label}<Icon name="arrow-left" size={16} /></a>)}</nav><div className="menu-drawer__footer"><a href="#account">ورود به حساب کاربری</a><a href="#support">پشتیبانی و تماس</a></div></aside></div>;
}

function RouteView({ route, cartCount, isWishlisted, onToggleWishlist, onAdd }: { route: string; cartCount: number; isWishlisted: (slug: string) => boolean; onToggleWishlist: (slug: string) => void; onAdd: (product: Product) => void }) {
  const path = route.split('?')[0] ?? '#home';
  const audienceMatch = path.match(/^#(?:category|products)\/(women|men|children)$/);
  if (path === '#home' || path === '#' || path === '#search') return <HomePage isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} onAdd={onAdd} />;
  if (path.startsWith('#category/')) return <CategoryPage audience={audienceMatch?.[1] as Audience | undefined} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} onAdd={onAdd} />;
  if (path === '#products' || path.startsWith('#products/')) { const mode = path.split('/')[1] ?? ''; return <ProductsPage audience={mode && ['women', 'men', 'children'].includes(mode) ? (mode as Audience) : undefined} mode={mode} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} onAdd={onAdd} />; }
  if (path.startsWith('#product/')) return <ProductPage slug={path.split('/')[1] ?? ''} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} onAdd={onAdd} />;
  if (path === '#cart') return <CartPage cartCount={cartCount} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} onAdd={onAdd} />;
  if (path === '#checkout/confirmation') return <ConfirmationPage />;
  if (path.startsWith('#checkout/')) return <CheckoutPage step={path.split('/')[1] ?? 'address'} cartCount={cartCount} />;
  if (path === '#account' || path.startsWith('#account/')) return <AccountPage section={path.split('/')[1] ?? 'dashboard'} />;
  if (path.startsWith('#order/')) return <OrderPage />;
  if (['#campaign', '#guide', '#article', '#lookbook', '#about', '#trust'].includes(path)) return <EditorialPage page={path.slice(1)} />;
  if (path === '#size-guide' || path === '#shipping-policy' || path === '#returns-policy' || path === '#care-guide' || path === '#faq' || path === '#contact' || path === '#privacy' || path === '#terms' || path === '#support') return <EditorialPage page={path.slice(1)} />;
  if (path === '#admin' || path.startsWith('#admin/')) return <AdminPage page={path.slice('#admin'.length).replace(/^\//, '') || 'admin'} />;
  return <NotFoundPage />;
}

export function App() {
  const route = useHashRoute();
  useScrollToTop(route);
  const [cartCount, setCartCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [wishlist, setWishlist] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const title = route.startsWith('#admin') ? 'NOVA Admin' : route === '#home' || route === '#' ? 'NOVA | Atelier Editorial' : 'NOVA | فروشگاه پوشاک';
    document.title = title;
  }, [route]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (route === '#search') setSearchOpen(true);
  }, [route]);

  const addToCart = (product: Product) => {
    setCartCount((count) => count + 1);
    setToast(`«${product.name}» به سبد خرید اضافه شد`);
  };

  const toggleWishlist = (slug: string) => {
    setWishlist((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <div className={`app-root min-h-svh bg-background ${route.startsWith('#admin') ? 'app-root--admin' : ''}`} dir="rtl">
      {!route.startsWith('#admin') ? <Header cartCount={cartCount} onSearch={() => setSearchOpen(true)} onMenu={() => setMenuOpen(true)} /> : null}
      <RouteView route={route} cartCount={cartCount} isWishlisted={(slug) => wishlist.has(slug)} onToggleWishlist={toggleWishlist} onAdd={addToCart} />
      {!route.startsWith('#admin') ? <MobileBottomNav cartCount={cartCount} /> : null}
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      {toast ? <div className="toast fixed z-[600] flex items-center bg-primary-hover text-primary-foreground shadow-float" role="status" aria-live="polite"><Icon name="check" size={17} />{toast}<a href="#cart">مشاهده سبد</a></div> : null}
    </div>
  );
}
