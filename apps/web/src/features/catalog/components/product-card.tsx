import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';
import { type StorefrontProduct } from '@/features/catalog/api/catalog-api';

import { formatToman } from '@/shared/utils/format-toman';

import { validCompareAt } from '@/features/catalog/components/valid-compare-at';

export function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onAdd,
}: {
  product: StorefrontProduct;
  isWishlisted: boolean;
  onToggleWishlist: (slug: string) => void;
  onAdd: (product: StorefrontProduct) => void;
}) {
  const compareAt = validCompareAt(product.price, product.compareAt);
  const variants = product.variants ?? [];
  const disabled =
    product.available === false ||
    (variants.length > 0 && !variants.some((variant) => variant.available));

  return (
    <article className={`product-card${disabled ? ' is-unavailable' : ''}`}>
      <div className="product-card__media">
        <a
          href={`/product/${encodeURIComponent(product.slug)}`}
          aria-label={`مشاهده ${product.name}`}
        >
          {product.image ? (
            <img src={product.image} alt={product.alt} loading="lazy" />
          ) : (
            <span className="product-card__placeholder">
              <Icon name="shirt" size={32} />
            </span>
          )}
        </a>
        {disabled ? (
          <span className="product-card__sold-out" aria-hidden="true">
            <span>ناموجود</span>
          </span>
        ) : null}
        <Button
          className={`icon-button product-card__favorite ${isWishlisted ? 'is-selected' : ''}`}
          type="button"
          aria-label={
            isWishlisted
              ? `حذف ${product.name} از علاقه‌مندی‌ها`
              : `افزودن ${product.name} به علاقه‌مندی‌ها`
          }
          aria-pressed={isWishlisted}
          onClick={() => onToggleWishlist(product.slug)}
        >
          <Icon name="heart" size={17} />
        </Button>
        {product.tag ? <span className="product-card__tag">{product.tag}</span> : null}
      </div>

      <div className="product-card__body">
        <a className="product-card__title" href={`/product/${encodeURIComponent(product.slug)}`}>
          {product.name}
        </a>
        {product.stock === 'رو به اتمام' ? (
          <p className="product-card__meta">
            <span className="is-warning">رو به اتمام</span>
          </p>
        ) : null}
        <div className="product-card__footer">
          <div className="product-card__price">
            {compareAt ? <del>{formatToman(compareAt)}</del> : null}
            <strong>{formatToman(product.price)}</strong>
          </div>
        </div>
        {product.colors.length > 0 ? (
          <div className="product-card__swatches" aria-label="رنگ‌های موجود">
            {product.colors.slice(0, 4).map((color) => (
              <span style={{ backgroundColor: color }} key={color} />
            ))}
          </div>
        ) : null}
        <Button
          className="product-card__add"
          type="button"
          disabled={disabled}
          aria-label={
            disabled ? `${product.name} قابل افزودن نیست` : `افزودن ${product.name} به سبد`
          }
          onClick={() => onAdd(product)}
        >
          <Icon name="bag" size={16} />
          {disabled ? 'ناموجود' : 'افزودن به سبد خرید'}
        </Button>
      </div>
    </article>
  );
}
