# Page Context

## Page

**Path:** `src/features/catalog/components/home-discovery.tsx`

```tsx
import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';
import { Logo } from '@/shared/ui/logo';
import { toStorefrontProduct, useCatalogProducts } from '@/features/catalog/api/catalog-api';

import type { StorefrontDiscoveryPageProps } from '@/features/catalog/pages/storefront-discovery-page-shared';

import { AddToCartFeedback } from '@/features/catalog/components/add-to-cart-feedback';

import { CatalogQueryState } from '@/features/catalog/components/catalog-query-state';

import { formatToman } from '@/shared/utils/format-toman';

import { useProductAdder } from '@/features/catalog/components/use-product-adder';

import './home-discovery.reference.css';

export function HomeDiscovery({ props }: { props: StorefrontDiscoveryPageProps }) {
  const productsQuery = useCatalogProducts({ limit: 8, sort: 'newest' });
  const adder = useProductAdder();
  const isWishlisted = props.isWishlisted ?? (() => false);
  const onToggleWishlist = props.onToggleWishlist ?? (() => undefined);
  const products = productsQuery.data?.items.map(toStorefrontProduct) ?? [];
  const selectedProducts = products.length > 4 ? products.slice(4, 8) : products.slice(0, 4);

  const categories = [
    { label: 'زنانه', href: '/category/women', image: '/assets/nova-women-lifestyle.webp' },
    { label: 'مردانه', href: '/category/men', image: '/assets/nova-hero-men.webp' },
    { label: 'بچگانه', href: '/category/children', image: '/assets/nova-children-lifestyle.webp' },
    { label: 'اکسسوری', href: '/products/accessories', image: '/assets/nova-product-textured-scarf.webp' },
    { label: 'جدیدترین‌ها', href: '/products/new', image: '/assets/nova-hero-editorial-v2.png' },
    { label: 'کالکشن‌ها', href: '/campaign', image: '/assets/nova-home-mobile-story.webp' },
    { label: 'تخفیف‌ها', href: '/products/sale', image: '/assets/nova-product-knit-cardigan.webp' },
  ];
  const mobileCategoryHrefs = new Set([
    '/products/accessories',
    '/products/new',
    '/products/sale',
  ]);
  const mobileCategories = categories.filter((category) => mobileCategoryHrefs.has(category.href));

  const benefits = [
    {
      icon: 'truck' as const,
      title: 'روش‌های ارسال',
      detail: 'هزینه و زمان ارسال هنگام پرداخت',
    },
    {
      icon: 'shield' as const,
      title: 'ضمانت اصالت کالا',
      detail: 'تضمین کیفیت و بازگشت کالا',
    },
    {
      icon: 'package' as const,
      title: 'شرایط بازگشت کالا',
      detail: 'جزئیات در راهنمای بازگشت کالا',
    },
    {
      icon: 'users' as const,
      title: 'پشتیبانی اختصاصی',
      detail: 'همیشه در کنار شما هستیم',
    },
  ];

  const renderProduct = (
    product: (typeof products)[number],
    options: { compact?: boolean; badge?: string } = {},
  ) => (
    <article
      className={options.compact ? 'nova-product-card nova-product-card--compact' : 'nova-product-card'}
      key={product.slug}
    >
      <div className="nova-product-card__media">
        <a
          href={`/product/${encodeURIComponent(product.slug)}`}
          aria-label={`مشاهده ${product.name}`}
        >
          {product.image ? (
            <img src={product.image} alt={product.alt} loading="lazy" />
          ) : (
            <Icon name="shirt" size={30} />
          )}
        </a>
        <Button
          className={`icon-button nova-product-card__favorite ${isWishlisted(product.slug) ? 'is-selected' : ''}`}
          type="button"
          aria-label={
            isWishlisted(product.slug)
              ? `حذف ${product.name} از علاقه‌مندی‌ها`
              : `افزودن ${product.name} به علاقه‌مندی‌ها`
          }
          aria-pressed={isWishlisted(product.slug)}
          onClick={() => onToggleWishlist(product.slug)}
        >
          <Icon name="heart" size={18} />
        </Button>
        {options.badge ? <span className="nova-product-card__badge">{options.badge}</span> : null}
      </div>

      <div className="nova-product-card__body">
        <a
          className="nova-product-card__name"
          href={`/product/${encodeURIComponent(product.slug)}`}
        >
          {product.name}
        </a>
        <div className="nova-product-card__meta" aria-hidden="true">
          {product.colors.map((color) => <span key={color} className="nova-swatch" style={{ backgroundColor: color }} />)}
        </div>
        <strong className="nova-product-card__price">{formatToman(product.price)}</strong>
        <Button
          className="nova-product-card__add"
          type="button"
          variant="outline"
          onClick={() => adder.add(product)}
          disabled={!product.available || adder.isPending}
        >
          افزودن به سبد <Icon name="bag" size={17} />
        </Button>
      </div>
    </article>
  );

  const renderMobileProduct = (
    product: (typeof products)[number],
    badge?: string,
    compact = false,
  ) => (
    <article
      className={`atelier-mobile-product${compact ? ' atelier-mobile-product--compact' : ''}`}
      key={product.slug}
    >
      <div className="atelier-mobile-product__media">
        <a
          href={`/product/${encodeURIComponent(product.slug)}`}
          aria-label={`مشاهده ${product.name}`}
        >
          {product.image ? (
            <img src={product.image} alt={product.alt} loading="lazy" />
          ) : (
            <Icon name="shirt" size={28} />
          )}
        </a>
        <Button
          className={`icon-button atelier-mobile-product__favorite ${isWishlisted(product.slug) ? 'is-selected' : ''}`}
          type="button"
          aria-label={
            isWishlisted(product.slug)
              ? `حذف ${product.name} از علاقه‌مندی‌ها`
              : `افزودن ${product.name} به علاقه‌مندی‌ها`
          }
          aria-pressed={isWishlisted(product.slug)}
          onClick={() => onToggleWishlist(product.slug)}
        >
          <Icon name="heart" size={19} />
        </Button>
        {badge ? <span className="atelier-mobile-product__badge">{badge}</span> : null}
      </div>
      <div className="atelier-mobile-product__details">
        <a href={`/product/${encodeURIComponent(product.slug)}`}>{product.name}</a>
        <div className="atelier-mobile-product__swatches" aria-hidden="true">
          {product.colors.map((color) => <span key={color} className="nova-swatch" style={{ backgroundColor: color }} />)}
        </div>
        <strong>{formatToman(product.price)}</strong>
        <Button
          type="button"
          variant="outline"
          onClick={() => adder.add(product)}
          disabled={!product.available || adder.isPending}
        >
          افزودن به سبد <Icon name="bag" size={17} />
        </Button>
      </div>
    </article>
  );

  const featuredProduct = products.find((product) =>
    product.categories?.some((category) => category.slug === 'accessories'),
  );
  const featuredColors = productsQuery.data?.items.find((product) => product.slug === featuredProduct?.slug)?.colors ?? [];

  const newsletterForm = (idPrefix: string) => (
    <>
      <form
        className="nova-newsletter-form"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label className="sr-only" htmlFor={`${idPrefix}-newsletter-email`}>
          ایمیل شما
        </label>
        <input
          id={`${idPrefix}-newsletter-email`}
          type="email"
          name="email"
          placeholder="ایمیل شما"
          autoComplete="email"
          required
          disabled
        />
        <button type="submit" disabled>عضویت</button>
      </form>
      <p className="nova-newsletter-status">
        عضویت خبرنامه در حال حاضر فعال نیست.
      </p>
    </>
  );

  return (
    <main className="nova-reference-home bg-background">
      <div className="shell nova-reference-desktop">
        <section className="nova-home-hero-grid" aria-labelledby="storefront-home-title">
          <article className="nova-home-hero-main">
            <img
              src="/assets/nova-home-mobile-hero.webp"
              alt="مدل نوا با کیف زرشکی در کالکشن پاییز"
            />
            <div className="nova-home-hero-main__veil" aria-hidden="true" />
            <div className="nova-home-hero-main__copy">
              <h1 id="storefront-home-title">کالکشن پاییز</h1>
              <p className="nova-home-hero-main__lead">
                فرم‌های آرام
                <br />
                برای روزهای بلند
              </p>
              <p className="nova-home-hero-main__detail">
                جایی که استایل در جزئیات با زندگی امروز ملاقات می‌کند.
              </p>
              <div className="nova-home-hero-main__actions">
                <a className="nova-home-button nova-home-button--primary" href="/campaign">
                  مشاهده کالکشن <Icon name="arrow-left" size={16} />
                </a>
                <a className="nova-home-button nova-home-button--outline" href="/category/women">
                  خرید زنانه
                </a>
              </div>
              <div className="nova-home-hero-dots" aria-hidden="true">
                <span />
                <span />
                <span className="is-active" />
              </div>
            </div>
          </article>

          <div className="nova-home-hero-stack">
            <a className="nova-home-hero-tile" href="/category/men">
              <img src="/assets/nova-hero-men.webp" alt="" />
              <span>
                <strong>مجموعه مردانه</strong>
                <small>استایل معاصر برای لحظه‌های ماندگار</small>
                <em>
                  مشاهده <Icon name="arrow-left" size={13} />
                </em>
              </span>
            </a>
            <a className="nova-home-hero-tile" href="/category/children">
              <img src="/assets/nova-children-lifestyle.webp" alt="" />
              <span>
                <strong>مجموعه بچگانه</strong>
                <small>لباس‌هایی راحت، شاد و ظریف</small>
                <em>
                  مشاهده <Icon name="arrow-left" size={13} />
                </em>
              </span>
            </a>
          </div>

          <article className="nova-home-featured-product">
            {featuredProduct ? (
              <span className="nova-home-featured-product__badge">منتخب سردبیر</span>
            ) : null}
            <div className="nova-home-featured-product__media">
              {featuredProduct?.image ? (
                <img src={featuredProduct.image} alt={featuredProduct.alt} />
              ) : !featuredProduct ? (
                <a href="/products/accessories" aria-label="مشاهده اکسسوری‌های نوا">
                  <img src="/assets/nova-product-textured-scarf.webp" alt="شال بافتنی و جزئیات اکسسوری نوا" />
                </a>
              ) : (
                <span className="nova-home-featured-product__placeholder" aria-hidden="true">
                  <Icon name="shirt" size={32} />
                </span>
              )}
            </div>
            {featuredProduct ? (
              <div className="nova-home-featured-product__body">
                <a href={`/product/${encodeURIComponent(featuredProduct.slug)}`}>
                  {featuredProduct.name}
                </a>
                {featuredColors.length ? <span>{featuredColors.map((color) => color.name).join('، ')}</span> : null}
                <strong>{formatToman(featuredProduct.price)}</strong>
                <div className="nova-home-featured-product__swatches" aria-hidden="true">
                  {featuredProduct.colors.map((color) => <span key={color} className="nova-swatch" style={{ backgroundColor: color }} />)}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!featuredProduct.available || adder.isPending}
                  onClick={() => adder.add(featuredProduct)}
                >
                  افزودن به سبد <Icon name="bag" size={17} />
                </Button>
              </div>
            ) : (
              <div className="nova-home-featured-product__body nova-home-featured-product__body--collection">
                <a href="/products/accessories">اکسسوری‌های نوا</a>
                <span>بافت‌ها و جزئیاتی برای کامل کردن استایل روزمره</span>
                <a className="nova-home-featured-product__collection-link" href="/products/accessories">
                  مشاهده محصولات <Icon name="arrow-left" size={14} />
                </a>
              </div>
            )}
          </article>
        </section>

        <nav className="nova-home-category-strip" aria-label="دسته‌بندی‌های فروشگاه">
          {categories.map((category, index) => (
            <a
              className={index === categories.length - 1 ? 'is-sale' : undefined}
              href={category.href}
              key={category.href}
            >
              <img src={category.image} alt="" loading="lazy" />
              {index === categories.length - 1 ? (
                <span className="nova-home-category-strip__sale-mark" aria-hidden="true">
                  %
                </span>
              ) : null}
              <span>
                {category.label} <Icon name="arrow-left" size={14} />
              </span>
            </a>
          ))}
        </nav>

        <section className="nova-home-section" aria-labelledby="nova-home-new-title">
          <div className="nova-home-section-heading">
            <h2 id="nova-home-new-title">جدیدترین‌ها</h2>
            <a href="/products/new">
              مشاهده همه <Icon name="arrow-left" size={15} />
            </a>
          </div>
          <CatalogQueryState query={productsQuery}>
            <div className="nova-home-products">
              {products.slice(0, 4).map((product, index) =>
                renderProduct(product, { badge: index === 0 || index === 2 ? 'جدید' : undefined }),
              )}
            </div>
          </CatalogQueryState>
        </section>

        <section className="nova-home-atelier" aria-labelledby="nova-home-atelier-title">
          <img
            className="nova-home-atelier__image"
            src="/assets/nova-home-mobile-story.webp"
            alt="انتخاب پارچه و لباس در آتلیه نوا"
            loading="lazy"
          />
          <div className="nova-home-atelier__copy">
            <span>ATELIER</span>
            <h2 id="nova-home-atelier-title">لباس‌هایی برای استایل‌های واقعی</h2>
            <p>
              در دنیای واقعی، استایل از یک ترند فراتر است. در نوا، کیفیت، جزئیات دقیق و راحتی را
              برای همه لحظه‌های زندگی انتخاب می‌کنیم.
            </p>
            <a className="nova-home-button nova-home-button--outline" href="/about">
              درباره کالکشن پاییز
            </a>
          </div>
          <aside className="nova-home-atelier__note" aria-hidden="true">
            <svg className="nova-home-atelier__botanical" viewBox="0 0 140 170" fill="none">
              <path d="M34 155C49 130 52 106 60 83C68 60 82 40 112 13" />
              <path d="M61 82C42 65 28 67 18 84C34 96 49 94 61 82Z" />
              <path d="M60 83L25 79" />
              <path d="M72 58C69 37 78 25 99 21C101 40 92 54 72 58Z" />
              <path d="M72 58L93 27" />
              <path d="M48 120C32 106 18 110 10 128C27 137 41 133 48 120Z" />
              <path d="M48 120L18 123" />
              <path d="M89 37C94 16 108 9 128 16C123 35 109 43 89 37Z" />
              <path d="M89 37L120 19" />
              <path d="M56 98C70 107 84 101 88 82C69 78 58 84 56 98Z" />
              <path d="M56 98L81 87" />
            </svg>
            <span>اصالت</span>
            <span>در جزئیات</span>
            <span>زندگی روزمره</span>
          </aside>
        </section>

        {selectedProducts.length > 0 ? <section className="nova-home-section" aria-labelledby="nova-home-best-title">
          <div className="nova-home-section-heading">
            <h2 id="nova-home-best-title">انتخاب‌های نوا</h2>
            <a href="/products">
              مشاهده همه <Icon name="arrow-left" size={15} />
            </a>
          </div>
          {productsQuery.data?.items.length ? (
            <div className="nova-home-products nova-home-products--compact">
              {selectedProducts.map((product) => renderProduct(product, { compact: true }))}
            </div>
          ) : null}
        </section> : null}

        <section className="nova-home-benefits" aria-label="مزایای خرید از نوا">
          {benefits.map((benefit) => (
            <div key={benefit.title}>
              <Icon name={benefit.icon} size={32} />
              <span>
                <strong>{benefit.title}</strong>
                <small>{benefit.detail}</small>
              </span>
            </div>
          ))}
        </section>

        <section className="nova-home-bottom-grid">
          <a className="nova-home-journal" href="/article">
            <img
              src="/assets/nova-home-mobile-journal.webp"
              alt="مجله مد و فنجان قهوه"
              loading="lazy"
            />
            <span>
              <small>مجله نوا</small>
              <strong>پاییز فصل ایده‌ها و فرم‌های تازه</strong>
              <p>از ترندهای فصلی تا راهنمای استایل؛ در مجله نوا با ما همراه باشید.</p>
              <em>
                مشاهده همه <Icon name="arrow-left" size={13} />
              </em>
            </span>
          </a>

          <section className="nova-home-newsletter" aria-labelledby="nova-home-newsletter-title">
            <div>
              <h2 id="nova-home-newsletter-title">عضویت در خبرنامه</h2>
              <p>از جدیدترین محصولات، داستان‌ها و پیشنهادهای ویژه باخبر شوید.</p>
            </div>
            {newsletterForm('desktop')}
            <label className="nova-home-newsletter__privacy">
              <input type="checkbox" />
              با عضویت در خبرنامه، قوانین حریم خصوصی را می‌پذیرم.
            </label>
          </section>
        </section>

        <footer className="nova-home-footer">
          <div className="nova-home-footer__brand">
            <Logo descriptor="A MODERN PERSIAN WARDROBE" />
            <p>لباس‌هایی که بخشی از زندگی روزمره شما هستند؛ با نگاهی به فردا.</p>
          </div>

          <nav className="nova-home-footer__links" aria-label="پیوندهای پایین صفحه">
            <div>
              <strong>خرید از نوا</strong>
              <a href="/category/women">زنانه</a>
              <a href="/category/men">مردانه</a>
              <a href="/category/children">بچگانه</a>
              <a href="/products/accessories">اکسسوری</a>
              <a href="/products/sale">تخفیف‌ها</a>
            </div>
            <div>
              <strong>خدمات مشتریان</strong>
              <a href="/support">راهنمای خرید</a>
              <a href="/support">شرایط بازگشت کالا</a>
              <a href="/support">سوالات متداول</a>
              <a href="/support">پیگیری سفارش</a>
              <a href="/support">تماس با ما</a>
            </div>
            <div>
              <strong>درباره نوا</strong>
              <a href="/about">داستان ما</a>
              <a href="/about">ارزش‌های نوا</a>
              <a href="/about">همکاری با ما</a>
              <a href="/article">مجله نوا</a>
              <a href="/stores">فروشگاه‌های ما</a>
            </div>
          </nav>

          <div className="nova-home-footer__statement" aria-hidden="true">
            <span>لباس‌هایی</span>
            <span>برای انسان‌های</span>
            <span>امروز و فردا</span>
          </div>

          <div className="nova-home-footer__legal">
            <small>تمامی حقوق برای نوا محفوظ است. ۱۴۰۵</small>
            <nav aria-label="قوانین">
              <a href="/privacy">حریم خصوصی</a>
              <a href="/terms">قوانین و مقررات</a>
              <a href="/terms">شرایط استفاده</a>
            </nav>
          </div>
        </footer>

        {adder.feedback ? <AddToCartFeedback {...adder.feedback} /> : null}
      </div>

      <div className="atelier-mobile-home shell">
        <section className="atelier-mobile-hero" aria-labelledby="atelier-mobile-title">
          <img
            src="/assets/nova-home-mobile-hero.webp"
            alt="مدل نوا با کیف زرشکی در فضای گرم آتلیه"
          />
          <div className="atelier-mobile-hero__shade" aria-hidden="true" />
          <div className="atelier-mobile-hero__copy">
            <h1 id="atelier-mobile-title">کالکشن پاییز</h1>
            <p>
              فرم‌های آرام
              <br />
              برای روزهای بلند
            </p>
            <small>جایی که استایل در جزئیات با زندگی امروز ملاقات می‌کند.</small>
            <a href="/campaign">
              مشاهده کالکشن <Icon name="arrow-left" size={17} />
            </a>
          </div>
          <div className="atelier-mobile-hero__dots" aria-hidden="true">
            <span />
            <span />
            <span className="is-active" />
          </div>
        </section>

        <nav className="atelier-mobile-categories" aria-label="دسته‌بندی‌های فروشگاه">
          {mobileCategories.map((category, index) => (
            <a
              className={index === mobileCategories.length - 1 ? 'is-sale' : undefined}
              href={category.href}
              key={category.href}
            >
              <img src={category.image} alt="" loading="lazy" />
              {index === mobileCategories.length - 1 ? (
                <span className="atelier-mobile-categories__sale-mark" aria-hidden="true">
                  %
                </span>
              ) : null}
              <span>{category.label}</span>
            </a>
          ))}
        </nav>

        <section className="atelier-mobile-section" aria-labelledby="atelier-new-title">
          <div className="atelier-mobile-heading">
            <h2 id="atelier-new-title">جدیدترین‌ها</h2>
            <a href="/products/new">
              مشاهده همه <Icon name="arrow-left" size={16} />
            </a>
          </div>
          <CatalogQueryState query={productsQuery}>
            <div className="atelier-mobile-products">
              {products.slice(0, 2).map((product, index) =>
                renderMobileProduct(product, index === 0 ? 'جدید' : undefined),
              )}
            </div>
          </CatalogQueryState>
        </section>

        <section className="atelier-mobile-story" aria-labelledby="atelier-story-title">
          <img
            src="/assets/nova-home-mobile-story.webp"
            alt="انتخاب پارچه و لباس در آتلیه نوا"
            loading="lazy"
          />
          <div>
            <span>ATELIER</span>
            <h2 id="atelier-story-title">لباس‌هایی برای استایل‌های واقعی</h2>
            <p>
              در دنیای واقعی، استایل فراتر از یک ترند است. در نوا، کیفیت و جزئیات را برای لحظه‌های
              زندگی شما انتخاب می‌کنیم.
            </p>
            <a href="/about">درباره کالکشن پاییز</a>
          </div>
        </section>

        {selectedProducts.length > 0 ? <section className="atelier-mobile-section" aria-labelledby="atelier-selected-title">
          <div className="atelier-mobile-heading">
            <h2 id="atelier-selected-title">انتخاب‌های نوا</h2>
            <a href="/products">
              مشاهده همه <Icon name="arrow-left" size={16} />
            </a>
          </div>
          {productsQuery.data?.items.length ? (
            <div className="atelier-mobile-products atelier-mobile-products--compact">
              {selectedProducts.slice(0, 2).map((product) =>
                renderMobileProduct(product, undefined, true),
              )}
            </div>
          ) : null}
        </section> : null}

        <section className="atelier-mobile-benefits" aria-label="مزایای خرید از نوا">
          {benefits.map((benefit) => (
            <div key={benefit.title}>
              <Icon name={benefit.icon} size={29} />
              <span>
                <strong>{benefit.title}</strong>
                <small>{benefit.detail}</small>
              </span>
            </div>
          ))}
        </section>

        <section className="atelier-mobile-newsletter" aria-labelledby="atelier-newsletter-title">
          <img
            className="atelier-mobile-newsletter__image"
            src="/assets/nova-home-mobile-journal.webp"
            alt="مجله مد و فنجان قهوه در فضایی گرم"
            loading="lazy"
          />
          <div className="atelier-mobile-newsletter__copy">
            <h2 id="atelier-newsletter-title">با خبرهای خوب، یک قدم جلوتر باشید</h2>
            <p>از جدیدترین محصولات و پیشنهادهای ما باخبر شوید.</p>
            {newsletterForm('mobile')}
          </div>
        </section>

        <footer className="atelier-mobile-footer">
          <div className="atelier-mobile-footer__brand">
            <Logo descriptor="A MODERN PERSIAN WARDROBE" />
            <p>لباس‌هایی که بخشی از زندگی روزمره شما هستند؛ با نگاهی به فردا.</p>
          </div>
          <nav aria-label="پیوندهای پایین صفحه">
            <a href="/category/women">
              خرید از نوا <Icon name="arrow-left" size={13} />
            </a>
            <a href="/support">
              خدمات مشتریان <Icon name="arrow-left" size={13} />
            </a>
            <a href="/about">
              درباره نوا <Icon name="arrow-left" size={13} />
            </a>
          </nav>
          <div className="atelier-mobile-footer__legal">
            <small>تمامی حقوق برای نوا محفوظ است. ۱۴۰۵</small>
            <span>
              <a href="/privacy">حریم خصوصی</a>
              <a href="/terms">قوانین و مقررات</a>
              <a href="/terms">شرایط استفاده</a>
            </span>
          </div>
        </footer>

        {adder.feedback ? <AddToCartFeedback {...adder.feedback} /> : null}
      </div>
    </main>
  );
}

```

---

## Custom Components


### 1. Button

**Path:** `../../packages/ui/src/button.tsx`

```tsx
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from './cn';

export const buttonVariants = cva(
  'nova-button inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-transparent px-4 text-center text-sm font-semibold leading-5 transition-[background-color,border-color,color,transform] duration-[140ms] ease-out hover:-translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-foreground',
        secondary: 'bg-secondary text-foreground hover:bg-accent-soft hover:text-primary-hover',
        outline:
          'border-primary bg-transparent text-primary hover:border-primary-hover hover:bg-accent-soft hover:text-primary-hover',
        ghost: 'bg-transparent text-foreground hover:bg-secondary',
        destructive: 'bg-destructive text-primary-foreground hover:bg-destructive-hover',
      },
      size: {
        sm: 'min-h-11 px-3 text-[13px]',
        md: 'min-h-12',
        lg: 'min-h-[52px] px-5',
        icon: 'h-11 min-h-11 w-11 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled = false,
      'aria-busy': ariaBusy,
      'aria-disabled': ariaDisabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Component
        aria-busy={loading || ariaBusy || undefined}
        aria-disabled={isDisabled || ariaDisabled || undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        data-loading={loading ? 'true' : undefined}
        disabled={asChild ? disabled : isDisabled}
        ref={ref}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent motion-reduce:animate-none"
          />
        ) : null}
        {asChild ? <Slottable>{children}</Slottable> : children}
      </Component>
    );
  },
);

Button.displayName = 'Button';

```

---


### 2. AddToCartFeedback

**Path:** `src/features/catalog/components/add-to-cart-feedback.tsx`

```tsx
export function AddToCartFeedback({ message, error }: { message: string; error?: boolean }) {
  return (
    <p
      className={`text-sm ${error ? 'text-destructive' : 'text-success'}`}
      role={error ? 'alert' : 'status'}
    >
      {message}
    </p>
  );
}

```

---


### 3. CatalogQueryState

**Path:** `src/features/catalog/components/catalog-query-state.tsx`

```tsx
import { type ReactNode } from 'react';

import { ApiClientError } from '@nova/api-client';

import type { useCatalogProducts } from '@/features/catalog/api/catalog-api';

import { CatalogRefreshNotice } from '@/features/catalog/components/catalog-refresh-notice';

import { MessageCard } from '@/features/catalog/components/message-card';

import { ProductSkeleton } from '@/features/catalog/components/product-skeleton';

import { shouldShowCatalogRefreshNotice } from '@/features/catalog/components/should-show-catalog-refresh-notice';

export function CatalogQueryState({
  query,
  emptyTitle = 'محصولی برای نمایش پیدا نشد',
  children,
}: {
  query: ReturnType<typeof useCatalogProducts>;
  emptyTitle?: string;
  children: ReactNode;
}) {
  if (query.isPending && !query.data) return <ProductSkeleton />;
  if (query.isError && !query.data) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    const serviceUnavailable = query.error instanceof ApiClientError && query.error.status >= 500;
    return (
      <MessageCard
        title={
          offline
            ? 'اتصال اینترنت برقرار نیست'
            : serviceUnavailable
              ? 'سرویس فهرست محصولات در دسترس نیست'
              : 'بارگذاری محصولات ممکن نشد'
        }
        description={
          offline
            ? 'اتصال خود را بررسی کنید و دوباره تلاش کنید.'
            : serviceUnavailable
              ? 'ارتباط با سرور محصولات برقرار نشد. پس از بررسی وضعیت سامانه دوباره تلاش کنید.'
              : 'لطفاً چند لحظه بعد دوباره تلاش کنید.'
        }
        icon={offline ? 'info' : 'warning'}
        action="تلاش دوباره"
        onAction={() => void query.refetch()}
        tone="warning"
      />
    );
  }
  const refreshNotice = shouldShowCatalogRefreshNotice(query.isError, Boolean(query.data)) ? (
    <CatalogRefreshNotice onRetry={() => void query.refetch()} />
  ) : null;
  if (query.data && !query.data.items.length) {
    return (
      <div className="space-y-3">
        {refreshNotice}
        <MessageCard
          title={emptyTitle}
          description="فیلترها را تغییر دهید یا از انتخاب‌های تازه نوا دیدن کنید."
          icon="layers"
        />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {refreshNotice}
      {query.isFetching ? (
        <p className="text-xs text-muted-foreground" role="status">
          در حال به‌روزرسانی نتایج...
        </p>
      ) : null}
      {children}
    </div>
  );
}

```

---


### 4. CatalogRefreshNotice

**Path:** `src/features/catalog/components/catalog-refresh-notice.tsx`

```tsx
import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';

export function CatalogRefreshNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border border-warning bg-warning-soft p-4 text-sm"
      role="alert"
    >
      <span>به‌روزرسانی نتایج انجام نشد؛ اطلاعات فعلی ممکن است قدیمی باشد.</span>
      <Button type="button" size="sm" variant="outline" onClick={onRetry}>
        <Icon name="refresh" size={16} />
        تلاش دوباره
      </Button>
    </div>
  );
}

```

---


### 5. MessageCard

**Path:** `src/features/catalog/components/message-card.tsx`

```tsx
import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';

export function MessageCard({
  title,
  description,
  icon,
  action,
  onAction,
  tone = 'neutral',
}: {
  title: string;
  description: string;
  icon: 'info' | 'warning' | 'layers';
  action?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'warning' | 'error';
}) {
  return (
    <section
      className={`rounded-editorial border bg-surface p-7 text-center shadow-card ${tone === 'error' ? 'border-error text-destructive' : tone === 'warning' ? 'border-warning' : 'border-border'}`}
      role={tone === 'neutral' ? undefined : 'alert'}
    >
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Icon name={icon} size={22} />
      </span>
      <h2 className="mt-4 text-lg text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      {action && onAction ? (
        <Button className="mt-5" type="button" variant="outline" onClick={onAction}>
          <Icon name="refresh" size={16} />
          {action}
        </Button>
      ) : null}
    </section>
  );
}

```

---


### 6. ProductSkeleton

**Path:** `src/features/catalog/components/product-skeleton.tsx`

```tsx
export function ProductSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="product-grid product-grid--loading"
      role="status"
      aria-label="در حال بارگذاری محصولات"
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="product-skeleton motion-safe:animate-pulse" key={index} aria-hidden="true">
          <div className="product-skeleton__media" />
          <div className="product-skeleton__body">
            <div className="product-skeleton__title" />
            <div className="product-skeleton__meta" />
            <div className="product-skeleton__price" />
            <div className="product-skeleton__swatches">
              <span />
              <span />
              <span />
            </div>
            <div className="product-skeleton__action" />
          </div>
        </div>
      ))}
    </div>
  );
}

```

---


### 7. Icon

**Path:** `src/shared/ui/icon.tsx`

```tsx
import type { ReactNode, SVGProps } from 'react';

export type IconName =
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
  | 'filter'
  | 'grid'
  | 'heart'
  | 'home'
  | 'info'
  | 'instagram'
  | 'layers'
  | 'mail'
  | 'menu'
  | 'more-vertical'
  | 'package'
  | 'plus'
  | 'refresh'
  | 'rotate'
  | 'search'
  | 'send'
  | 'settings'
  | 'shield'
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
  filter: (
    <>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
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
  heart: (
    <path d="M20.8 8.8c0 5.2-8.8 10.4-8.8 10.4S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.3Z" />
  ),
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
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 5.5L19.5 7" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  'more-vertical': (
    <>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
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
  shield: <path d="M12 3.5 19 6v5.5c0 4.3-2.7 7.7-7 9-4.3-1.3-7-4.7-7-9V6l7-2.5Z" />,
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

export function Icon({ name, size = 20, ...props }: IconProps) {
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

```

---


### 8. Logo

**Path:** `src/shared/ui/logo.tsx`

```tsx
export function Logo({ descriptor = 'ATELIER EDITORIAL' }: { descriptor?: string } = {}) {
  return (
    <a
      className="brand-lockup inline-flex w-max flex-col items-center leading-none"
      href="/"
      aria-label="NOVA، صفحه اصلی"
    >
      <span className="brand-lockup__name">NOVA</span>
      <span className="brand-lockup__descriptor !text-muted-foreground">{descriptor}</span>
    </a>
  );
}

```

---


## Summary

- Page: `src/features/catalog/components/home-discovery.tsx`
- Custom component files: 8
- Total files included: 9
