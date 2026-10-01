import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';
import { type StorefrontProduct } from '@/features/catalog/api/catalog-api';

import { formatToman } from '@/shared/utils/format-toman';

export function RecommendationCard({
  product,
  onAdd,
  busy,
}: {
  product: StorefrontProduct;
  onAdd: (product: StorefrontProduct) => void;
  busy: boolean;
}) {
  const variant = product.variants?.find((item) => item.available);
  const disabled = !variant || product.available === false || busy;
  return (
    <article className="recommendation-card">
      <a
        className="recommendation-card__media"
        href={`/product/${encodeURIComponent(product.slug)}`}
        aria-label={`مشاهده ${product.name}`}
      >
        {product.image ? (
          <img src={product.image}
            alt={product.alt}
            loading="lazy"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground">
            <Icon name="shirt" size={25} />
          </span>
        )}
      </a>
      <div className="recommendation-card__body">
        <a
          className="recommendation-card__title"
          href={`/product/${encodeURIComponent(product.slug)}`}
        >
          {product.name}
        </a>
        <div className="recommendation-card__footer">
          <span className="recommendation-card__price">{formatToman(product.price)}</span>
          <Button
            className="recommendation-card__add"
            type="button"
            disabled={disabled}
            aria-label={
              disabled ? `${product.name} قابل افزودن نیست` : `افزودن ${product.name} به سبد`
            }
            onClick={() => onAdd(product)}
          >
            <Icon name="plus" size={16} />
          </Button>
        </div>
      </div>
    </article>
  );
}
