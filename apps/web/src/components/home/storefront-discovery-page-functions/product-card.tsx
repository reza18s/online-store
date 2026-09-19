import { Button } from '@nova/ui';
import { Icon } from '../../ui/icon';
import { type StorefrontProduct } from '../../../lib/catalog/catalog-api';

import { availabilityLabel } from './availability-label';

import { formatToman } from './format-toman';

import { validCompareAt } from './valid-compare-at';

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
    <article className="min-w-0">
      <div className="relative aspect-square overflow-hidden rounded-editorial bg-secondary">
        <a
          href={`#product/${encodeURIComponent(product.slug)}`}
          aria-label={`مشاهده ${product.name}`}
        >
          {product.image ? (
            <img
              className="h-full w-full object-cover"
              src={product.image}
              alt={product.alt}
              loading="lazy"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-muted-foreground">
              <Icon name="shirt" size={32} />
            </span>
          )}
        </a>
        <Button
          className={`icon-button absolute end-2 top-2 bg-surface/90 ${isWishlisted ? 'text-primary' : ''}`}
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
        {product.tag ? (
          <span className="absolute start-2 top-2 rounded-control bg-success-soft px-2 py-1 text-[10px] text-success">
            {product.tag}
          </span>
        ) : null}
      </div>
      <div className="space-y-1.5 pt-2.5">
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>{product.category}</span>
          <span className={product.stock === 'رو به اتمام' ? 'text-warning' : ''}>
            {availabilityLabel(product)}
          </span>
        </div>
        <a
          className="block text-sm font-semibold leading-6 hover:text-primary focus-visible:text-primary"
          href={`#product/${encodeURIComponent(product.slug)}`}
        >
          {product.name}
        </a>
        <div className="flex items-end justify-between gap-2">
          <div className="text-[13px] font-bold text-primary">
            {compareAt ? (
              <del className="block text-[11px] font-normal text-muted-foreground">
                {formatToman(compareAt)}
              </del>
            ) : null}
            <strong>{formatToman(product.price)}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1" aria-label="رنگ‌های موجود">
              {product.colors.map((color) => (
                <span
                  className="h-3.5 w-3.5 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                  key={color}
                />
              ))}
            </div>
            <Button
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:-translate-y-px hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              type="button"
              disabled={disabled}
              aria-label={
                disabled ? `${product.name} قابل افزودن نیست` : `افزودن ${product.name} به سبد`
              }
              onClick={() => onAdd(product)}
            >
              <Icon name="plus" size={17} />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
