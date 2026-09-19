import { Button } from '@nova/ui';
import { Icon } from '../../ui/icon';
import { toStorefrontProduct, useCatalogProducts } from '../../../lib/catalog/catalog-api';

import type { StorefrontDiscoveryPageProps } from '../../../pages/catalog/storefront-discovery-page-shared';

import { AddToCartFeedback } from './add-to-cart-feedback';

import { CatalogQueryState } from './catalog-query-state';

import { formatToman } from './format-toman';

import { useProductAdder } from './use-product-adder';

export function HomeDiscovery({ props }: { props: StorefrontDiscoveryPageProps }) {
  const productsQuery = useCatalogProducts({ limit: 8, sort: 'newest' });
  const adder = useProductAdder();
  const isWishlisted = props.isWishlisted ?? (() => false);
  const onToggleWishlist = props.onToggleWishlist ?? (() => undefined);
  const products = productsQuery.data?.items.map(toStorefrontProduct) ?? [];
  const lookbookStories = [
    {
      title: 'شهر در پاییز',
      description: 'لایه‌هایی گرم برای قدم‌زدن‌های ماندگار',
      image: '/assets/nova-women-lifestyle.webp',
      href: '#campaign',
    },
    {
      title: 'مینیمال، همیشه زیباست',
      description: 'فرم‌های ساده برای جزئیات روزمره',
      image: '/assets/nova-hero-editorial-v2.png',
      href: '#category/women',
    },
    {
      title: 'تعادل در هر فصل',
      description: 'استایلی برای تمام لحظه‌ها',
      image: '/assets/nova-hero-men.webp',
      href: '#category/men',
    },
    {
      title: 'شب‌های تهران',
      description: 'وقتی استایل، داستان می‌گوید',
      image: '/assets/nova-materials.webp',
      href: '#article',
    },
  ];
  return (
    <main className="lookbook-home bg-background">
      <div className="shell">
        <section className="lookbook-hero" aria-labelledby="storefront-home-title">
          <img
            src="/assets/nova-hero-editorial-v2.png"
            alt="استایل زنانه نوا در آتلیه‌ای با نور گرم"
          />
          <div className="lookbook-hero__shade" aria-hidden="true" />
          <div className="lookbook-hero__copy">
            <span>NOVA LOOKBOOK</span>
            <h1 id="storefront-home-title">استایل‌هایی برای زندگی واقعی</h1>
            <p>ترکیبی از ظرافت، شخصیت و لحظه‌های خاص؛ الهام بگیرید، سبک خود را پیدا کنید.</p>
            <a className="lookbook-button" href="#campaign">
              مشاهده لوک‌بوک <Icon name="arrow-left" size={16} />
            </a>
            <small>REAL PEOPLE · BEAUTIFUL STORIES</small>
          </div>
          <aside className="lookbook-hero__note" aria-hidden="true">
            <p>بیش از مد، یک سبک زندگی.</p>
            <span>
              TIMELESS
              <br />
              ELEGANT
              <br />
              PERSIAN
              <br />
              ALWAYS YOU
            </span>
          </aside>
        </section>

        <section className="lookbook-stories" aria-labelledby="lookbook-stories-title">
          <div className="lookbook-section-heading">
            <div>
              <span>NOVA / EDITORIAL STORIES</span>
              <h2 id="lookbook-stories-title">مجموعه استایل‌ها</h2>
            </div>
            <a href="#campaign">
              مشاهده همه <Icon name="arrow-left" size={14} />
            </a>
          </div>
          <div className="lookbook-stories__grid">
            {lookbookStories.map((story) => (
              <a className="lookbook-story-card" href={story.href} key={story.title}>
                <img src={story.image} alt="" loading="lazy" />
                <div>
                  <strong>{story.title}</strong>
                  <p>{story.description}</p>
                  <span>
                    مشاهده استایل <Icon name="arrow-left" size={13} />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="lookbook-manifesto" aria-labelledby="lookbook-manifesto-title">
          <div className="lookbook-manifesto__portrait">
            <img
              src="/assets/nova-women-lifestyle.webp"
              alt="پرتره زن با استایل کلاسیک نوا"
              loading="lazy"
            />
            <blockquote>مد، راهی برای گفتن داستان خود است.</blockquote>
          </div>
          <div className="lookbook-manifesto__copy">
            <span>NOVA / PERSONAL STYLE</span>
            <h2 id="lookbook-manifesto-title">لحظه‌هایی که می‌مانند</h2>
            <p>
              هر استایل، بخشی از یک روایت است؛ از صبح‌های آرام تا شب‌های فراموش‌نشدنی. لوک‌بوک نوا،
              الهام‌گرفته از زنان واقعی و زندگی‌های زیباست.
            </p>
            <a href="#article">
              کاوش در لوک‌بوک <Icon name="arrow-left" size={14} />
            </a>
          </div>
          <a className="lookbook-manifesto__aside" href="#campaign">
            <img
              src="/assets/nova-materials.webp"
              alt="جزئیات معماری و بافت‌های الهام‌بخش نوا"
              loading="lazy"
            />
            <span>زیباتر از دیروز، برای فردایی روشن‌تر</span>
          </a>
        </section>

        <section className="lookbook-products" aria-labelledby="new-arrivals-title">
          <div className="lookbook-section-heading">
            <div>
              <span>SHOP THE LOOK</span>
              <h2 id="new-arrivals-title">آیتم‌های این استایل</h2>
            </div>
            <a href="#products/new">
              مشاهده همه <Icon name="arrow-left" size={14} />
            </a>
          </div>
          <CatalogQueryState query={productsQuery}>
            <div className="lookbook-products__grid">
              {products.slice(0, 6).map((product) => (
                <article className="lookbook-product" key={product.slug}>
                  <div className="lookbook-product__media">
                    <a
                      href={`#product/${encodeURIComponent(product.slug)}`}
                      aria-label={`مشاهده ${product.name}`}
                    >
                      {product.image ? (
                        <img src={product.image} alt={product.alt} loading="lazy" />
                      ) : (
                        <Icon name="shirt" size={30} />
                      )}
                    </a>
                    <Button
                      className={`icon-button lookbook-product__favorite ${isWishlisted(product.slug) ? 'is-selected' : ''}`}
                      type="button"
                      aria-label={
                        isWishlisted(product.slug)
                          ? `حذف ${product.name} از علاقه‌مندی‌ها`
                          : `افزودن ${product.name} به علاقه‌مندی‌ها`
                      }
                      aria-pressed={isWishlisted(product.slug)}
                      onClick={() => onToggleWishlist(product.slug)}
                    >
                      <Icon name="heart" size={15} />
                    </Button>
                  </div>
                  <a
                    className="lookbook-product__name"
                    href={`#product/${encodeURIComponent(product.slug)}`}
                  >
                    {product.name}
                  </a>
                  <button
                    className="lookbook-product__price"
                    type="button"
                    onClick={() => adder.add(product)}
                    disabled={adder.isPending}
                  >
                    {formatToman(product.price)}
                  </button>
                </article>
              ))}
              <a className="lookbook-shop-card" href="#products/new">
                <span>استایل کامل این لوک</span>
                <strong>خرید مجموعه</strong>
                <Icon name="arrow-left" size={17} />
              </a>
            </div>
          </CatalogQueryState>
          {adder.feedback ? <AddToCartFeedback {...adder.feedback} /> : null}
        </section>
      </div>
    </main>
  );
}
