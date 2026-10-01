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
    { label: 'اکسسوری', href: '/products/accessories', image: '/assets/nova-materials.webp' },
    { label: 'جدیدترین‌ها', href: '/products/new', image: '/assets/nova-hero-editorial-v2.png' },
    { label: 'کالکشن‌ها', href: '/campaign', image: '/assets/nova-home-mobile-story.webp' },
    { label: 'تخفیف‌ها', href: '/products/sale', image: '/assets/nova-product-knit-cardigan.webp' },
  ];

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

  const renderMobileProduct = (product: (typeof products)[number], badge?: string) => (
    <article className="atelier-mobile-product" key={product.slug}>
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

  const featuredProduct =
    products.find((product) => product.categories?.some((category) => category.slug === 'accessories')) ??
    products[4] ??
    products[0];
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
                  <img src="/assets/nova-materials.webp" alt="پارچه‌ها و بافت‌های اکسسوری نوا" />
                </a>
              ) : (
                <img src="/assets/nova-materials.webp" alt="اکسسوری منتخب نوا" />
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
          {categories.map((category, index) => (
            <a
              className={index === categories.length - 1 ? 'is-sale' : undefined}
              href={category.href}
              key={category.href}
            >
              <img src={category.image} alt="" loading="lazy" />
              {index === categories.length - 1 ? (
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
            <div className="atelier-mobile-products">
              {selectedProducts.slice(0, 2).map((product) => renderMobileProduct(product))}
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
